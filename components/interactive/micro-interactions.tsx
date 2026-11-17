// Zeltrium Micro-interactions for Framer, v1.0
// Five free Lottie UI micro-interactions: success, error, copy, checkbox, refresh.
// Recolor them to your brand and pick how they play, right in the properties panel.
// All 30 animations: https://zeltrium.com/?ref=framer
//
// Everything is in this file: the five animations and a tiny SVG player written
// for them. No third-party code, nothing is downloaded at runtime.

import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const ANIMS: Record<string, any> = {
    success: {
        v: "5.12.1",
        fr: 30,
        ip: 0,
        op: 18,
        w: 400,
        h: 400,
        nm: "success",
        ddd: 0,
        assets: [],
        layers: [
            {
                ddd: 0,
                ind: 1,
                ty: 4,
                nm: "checkmark 2",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [4.449, -11.685, 0], ix: 1, l: 2 },
                    s: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 11,
                                s: [100, 100, 100],
                            },
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 14,
                                s: [120, 120, 100],
                            },
                            { t: 17, s: [98, 98, 100] },
                        ],
                        ix: 6,
                        l: 2,
                    },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [-66.336, -17.836],
                                            [-16.5, 34.75],
                                            [75.234, -58.119],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [1, 0.290196078431, 0.109803921569, 1],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 9,
                                    s: [0],
                                },
                                { t: 14, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 9,
                op: 18,
                st: -7,
                ct: 1,
                bm: 0,
            },
            {
                ddd: 0,
                ind: 2,
                ty: 4,
                nm: "circle_stroke",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                d: 1,
                                ty: "el",
                                s: { a: 0, k: [300, 300], ix: 2 },
                                p: { a: 0, k: [0, 0], ix: 3 },
                                nm: "Ellipse Path 1",
                                mn: "ADBE Vector Shape - Ellipse",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Ellipse 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.667], y: [1] },
                                    o: { x: [0.333], y: [0] },
                                    t: 0,
                                    s: [0],
                                },
                                { t: 15, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 18,
                st: 0,
                ct: 1,
                bm: 0,
            },
        ],
        markers: [],
        props: {},
    },
    error: {
        v: "5.12.1",
        fr: 30,
        ip: 0,
        op: 16,
        w: 400,
        h: 400,
        nm: "error",
        ddd: 0,
        assets: [],
        layers: [
            {
                ddd: 0,
                ind: 1,
                ty: 4,
                nm: "cross_icon",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: {
                        a: 1,
                        k: [
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 7,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 9,
                                s: [218, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 11,
                                s: [182, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.167, y: 0 },
                                t: 13,
                                s: [210, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            { t: 15, s: [200, 200, 0] },
                        ],
                        ix: 2,
                        l: 2,
                    },
                    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [48.438, -48.438],
                                            [-48.438, 48.438],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [1, 0.290196078431, 0.109803921569, 1],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 2",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [-48.438, -48.438],
                                            [48.438, 48.438],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [1, 0.290196078431, 0.109803921569, 1],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 2,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 4,
                                    s: [0],
                                },
                                { t: 8, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 3,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 4,
                op: 16,
                st: 0,
                ct: 1,
                bm: 0,
            },
            {
                ddd: 0,
                ind: 2,
                ty: 4,
                nm: "circle_stroke",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: {
                        a: 1,
                        k: [
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 7,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 9,
                                s: [218, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.333, y: 0 },
                                t: 11,
                                s: [182, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.667, y: 1 },
                                o: { x: 0.167, y: 0 },
                                t: 13,
                                s: [210, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            { t: 15, s: [200, 200, 0] },
                        ],
                        ix: 2,
                        l: 2,
                    },
                    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                d: 1,
                                ty: "el",
                                s: { a: 0, k: [300, 300], ix: 2 },
                                p: { a: 0, k: [0, 0], ix: 3 },
                                nm: "Ellipse Path 1",
                                mn: "ADBE Vector Shape - Ellipse",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Ellipse 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.667], y: [1] },
                                    o: { x: [0.333], y: [0] },
                                    t: 0,
                                    s: [0],
                                },
                                { t: 9, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 16,
                st: 0,
                ct: 1,
                bm: 0,
            },
        ],
        markers: [],
        props: {},
    },
    copy: {
        v: "5.12.1",
        fr: 30,
        ip: 0,
        op: 25,
        w: 400,
        h: 400,
        nm: "copy",
        ddd: 0,
        assets: [],
        layers: [
            {
                ddd: 0,
                ind: 1,
                ty: 4,
                nm: "checkmark",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [11.281, -58.906, 0], ix: 1, l: 2 },
                    s: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 6,
                                s: [100, 100, 100],
                            },
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 9,
                                s: [110, 110, 100],
                            },
                            { t: 15, s: [100, 100, 100] },
                        ],
                        ix: 6,
                        l: 2,
                    },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [-126, -67.25],
                                            [-22.5, 34.75],
                                            [148.562, -152.562],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [1, 0.290196078431, 0.109803921569, 1],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 15,
                                    s: [0],
                                },
                                { t: 21, s: [100] },
                            ],
                            ix: 1,
                        },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 3,
                                    s: [0],
                                },
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 9,
                                    s: [100],
                                },
                                { t: 15, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 3,
                op: 21,
                st: -11,
                ct: 1,
                bm: 0,
            },
            {
                ddd: 0,
                ind: 2,
                ty: 4,
                nm: "front_sheet",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: {
                        a: 1,
                        k: [
                            {
                                i: { x: 0.9, y: 1 },
                                o: { x: 0.8, y: 0 },
                                t: 0,
                                s: [247, 247, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 1, y: 1 },
                                o: { x: 0.6, y: 0.6 },
                                t: 8,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.2, y: 1 },
                                o: { x: 0.1, y: 0 },
                                t: 16,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            { t: 24, s: [247, 247, 0] },
                        ],
                        ix: 2,
                        l: 2,
                    },
                    a: { a: 0, k: [47, 47, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ty: "rc",
                                d: 1,
                                s: { a: 0, k: [206, 206], ix: 2 },
                                p: { a: 0, k: [0, 0], ix: 3 },
                                r: { a: 0, k: 0, ix: 4 },
                                nm: "Rectangle Path 1",
                                mn: "ADBE Vector Shape - Rect",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [47, 47], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Rectangle 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.9], y: [1] },
                                    o: { x: [0.8], y: [0] },
                                    t: 0,
                                    s: [100],
                                },
                                {
                                    i: { x: [1], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 8,
                                    s: [0],
                                },
                                {
                                    i: { x: [0.2], y: [1] },
                                    o: { x: [0.1], y: [0] },
                                    t: 16,
                                    s: [0],
                                },
                                { t: 24, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: -97, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 25,
                st: 0,
                ct: 1,
                bm: 0,
            },
            {
                ddd: 0,
                ind: 3,
                ty: 4,
                nm: "back_sheet",
                sr: 1,
                ks: {
                    o: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.9], y: [1] },
                                o: { x: [0.8], y: [0] },
                                t: 0,
                                s: [100],
                            },
                            {
                                i: { x: [1], y: [1] },
                                o: { x: [0.6], y: [0] },
                                t: 8,
                                s: [0],
                            },
                            {
                                i: { x: [0.2], y: [1] },
                                o: { x: [0.1], y: [0] },
                                t: 16,
                                s: [0],
                            },
                            { t: 24, s: [100] },
                        ],
                        ix: 11,
                    },
                    r: { a: 0, k: 0, ix: 10 },
                    p: {
                        a: 1,
                        k: [
                            {
                                i: { x: 0.9, y: 1 },
                                o: { x: 0.8, y: 0 },
                                t: 0,
                                s: [153, 153, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 1, y: 1 },
                                o: { x: 0.6, y: 0.6 },
                                t: 8,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            {
                                i: { x: 0.2, y: 1 },
                                o: { x: 0.1, y: 0 },
                                t: 16,
                                s: [200, 200, 0],
                                to: [0, 0, 0],
                                ti: [0, 0, 0],
                            },
                            { t: 24, s: [153, 153, 0] },
                        ],
                        ix: 2,
                        l: 2,
                    },
                    a: { a: 0, k: [47, 47, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 1,
                                    k: [
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 3,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-8.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -9.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 4,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-48.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -24.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 5,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-63.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -37],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 6,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-86.75, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -54.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 7,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-86.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -74.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 16,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-86.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -74.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 17,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-86.75, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -54.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 18,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-63.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -37],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            i: { x: 0.833, y: 0.833 },
                                            o: { x: 0.167, y: 0.167 },
                                            t: 19,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-36, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -24.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                        {
                                            t: 20,
                                            s: [
                                                {
                                                    i: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    o: [
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                        [0, 0],
                                                    ],
                                                    v: [
                                                        [-8.5, 103],
                                                        [-103, 103],
                                                        [-103, -103],
                                                        [103, -103],
                                                        [103, -9.5],
                                                    ],
                                                    c: false,
                                                },
                                            ],
                                        },
                                    ],
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [47, 47], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Rectangle 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 25,
                st: 0,
                ct: 1,
                bm: 0,
            },
        ],
        markers: [
            { tm: 0, cm: "copy", dr: 15 },
            { tm: 15, cm: "reset", dr: 10 },
        ],
        props: {},
    },
    checkbox: {
        v: "5.12.1",
        fr: 30,
        ip: 0,
        op: 11,
        w: 400,
        h: 400,
        nm: "checkbox",
        ddd: 0,
        assets: [],
        layers: [
            {
                ddd: 0,
                ind: 1,
                ty: 4,
                nm: "checkmark",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [4.449, -11.685, 0], ix: 1, l: 2 },
                    s: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 4,
                                s: [100, 100, 100],
                            },
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 7,
                                s: [120, 120, 100],
                            },
                            { t: 10, s: [100, 100, 100] },
                        ],
                        ix: 6,
                        l: 2,
                    },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [-66.336, -17.836],
                                            [-16.5, 34.75],
                                            [75.234, -58.119],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [1, 0.290196078431, 0.109803921569, 1],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: { a: 0, k: 0, ix: 1 },
                        e: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 0,
                                    s: [0],
                                },
                                { t: 7, s: [100] },
                            ],
                            ix: 2,
                        },
                        o: { a: 0, k: 0, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 11,
                st: -7,
                ct: 1,
                bm: 0,
            },
            {
                ddd: 0,
                ind: 2,
                ty: 4,
                nm: "box_base",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: { a: 0, k: 0, ix: 10 },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                    s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                ty: "rc",
                                d: 1,
                                s: { a: 0, k: [300, 300], ix: 2 },
                                p: { a: 0, k: [0, 0], ix: 3 },
                                r: { a: 0, k: 15, ix: 4 },
                                nm: "Rectangle Path 1",
                                mn: "ADBE Vector Shape - Rect",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Rectangle 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 11,
                st: 0,
                ct: 1,
                bm: 0,
            },
        ],
        markers: [],
        props: {},
    },
    refresh: {
        v: "5.12.1",
        fr: 30,
        ip: 0,
        op: 26,
        w: 400,
        h: 400,
        nm: "refresh",
        ddd: 0,
        assets: [],
        layers: [
            {
                ddd: 0,
                ind: 1,
                ty: 4,
                nm: "arrow_circular",
                sr: 1,
                ks: {
                    o: { a: 0, k: 100, ix: 11 },
                    r: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.4], y: [1] },
                                o: { x: [0.6], y: [0] },
                                t: 5,
                                s: [0],
                            },
                            {
                                i: { x: [0.4], y: [1] },
                                o: { x: [0.6], y: [0] },
                                t: 20,
                                s: [385],
                            },
                            { t: 25, s: [360] },
                        ],
                        ix: 10,
                    },
                    p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
                    a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                    s: {
                        a: 1,
                        k: [
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 0,
                                s: [100, 100, 100],
                            },
                            {
                                i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] },
                                o: { x: [0.6, 0.6, 0.6], y: [0, 0, 0] },
                                t: 4,
                                s: [95, 95, 100],
                            },
                            { t: 8, s: [100, 100, 100] },
                        ],
                        ix: 6,
                        l: 2,
                    },
                },
                ao: 0,
                shapes: [
                    {
                        ty: "gr",
                        it: [
                            {
                                d: 1,
                                ty: "el",
                                s: { a: 0, k: [280, 280], ix: 2 },
                                p: { a: 0, k: [0, 0], ix: 3 },
                                nm: "Ellipse Path 1",
                                mn: "ADBE Vector Shape - Ellipse",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [0, 0], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: 0, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Ellipse 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 1,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                    {
                        ty: "tm",
                        s: {
                            a: 1,
                            k: [
                                {
                                    i: { x: [0.999], y: [1] },
                                    o: { x: [0.9], y: [0] },
                                    t: 0,
                                    s: [11.5],
                                },
                                {
                                    i: { x: [0.1], y: [1] },
                                    o: { x: [0.001], y: [0] },
                                    t: 9,
                                    s: [50],
                                },
                                {
                                    i: { x: [0.4], y: [1] },
                                    o: { x: [0.6], y: [0] },
                                    t: 20,
                                    s: [5],
                                },
                                { t: 25, s: [11.5] },
                            ],
                            ix: 1,
                        },
                        e: { a: 0, k: 100, ix: 2 },
                        o: { a: 0, k: 48, ix: 3 },
                        m: 1,
                        ix: 2,
                        nm: "Trim Paths 1",
                        mn: "ADBE Vector Filter - Trim",
                        hd: false,
                    },
                    {
                        ty: "gr",
                        it: [
                            {
                                ind: 0,
                                ty: "sh",
                                ix: 1,
                                ks: {
                                    a: 0,
                                    k: {
                                        i: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        o: [
                                            [0, 0],
                                            [0, 0],
                                            [0, 0],
                                        ],
                                        v: [
                                            [0, -55],
                                            [0, 0],
                                            [55, 0],
                                        ],
                                        c: false,
                                    },
                                    ix: 2,
                                },
                                nm: "Path 1",
                                mn: "ADBE Vector Shape - Group",
                                hd: false,
                            },
                            {
                                ty: "st",
                                c: {
                                    a: 0,
                                    k: [
                                        0.949019607843, 0.945098039216,
                                        0.929411764706, 1,
                                    ],
                                    ix: 3,
                                },
                                o: { a: 0, k: 100, ix: 4 },
                                w: { a: 0, k: 32, ix: 5 },
                                lc: 1,
                                lj: 1,
                                ml: 4,
                                bm: 0,
                                nm: "Stroke 1",
                                mn: "ADBE Vector Graphic - Stroke",
                                hd: false,
                            },
                            {
                                ty: "tr",
                                p: { a: 0, k: [114, -81], ix: 2 },
                                a: { a: 0, k: [0, 0], ix: 1 },
                                s: { a: 0, k: [100, 100], ix: 3 },
                                r: { a: 0, k: -90, ix: 6 },
                                o: { a: 0, k: 100, ix: 7 },
                                sk: { a: 0, k: 0, ix: 4 },
                                sa: { a: 0, k: 0, ix: 5 },
                                nm: "Transform",
                            },
                        ],
                        nm: "Shape 1",
                        np: 3,
                        cix: 2,
                        bm: 0,
                        ix: 3,
                        mn: "ADBE Vector Group",
                        hd: false,
                    },
                ],
                ip: 0,
                op: 26,
                st: 0,
                ct: 1,
                bm: 0,
            },
        ],
        markers: [],
        props: {},
    },
}

// ---------------------------------------------------------------------------
// Tiny Lottie player for these five files.
// Supports exactly what they use: shape layers, groups, paths, ellipses,
// rectangles, strokes, trim paths, group and layer transforms, keyframes with
// bezier easing, hold keyframes and spatial (curved) position paths.
// Renders to SVG. No dependencies, nothing downloaded.
// ---------------------------------------------------------------------------

const KAPPA = 0.5519

function bezierEasing(x1: number, y1: number, x2: number, y2: number) {
    if (x1 === y1 && x2 === y2) return (t: number) => t
    const A = (a: number, b: number) => 1 - 3 * b + 3 * a
    const B = (a: number, b: number) => 3 * b - 6 * a
    const C = (a: number) => 3 * a
    const calc = (t: number, a: number, b: number) =>
        ((A(a, b) * t + B(a, b)) * t + C(a)) * t
    const slope = (t: number, a: number, b: number) =>
        3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a)
    return (x: number) => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        let t = x
        for (let i = 0; i < 8; i++) {
            const s = slope(t, x1, x2)
            if (Math.abs(s) < 1e-6) break
            const d = calc(t, x1, x2) - x
            if (Math.abs(d) < 1e-7) return calc(t, y1, y2)
            t -= d / s
        }
        let lo = 0
        let hi = 1
        t = x
        for (let i = 0; i < 40; i++) {
            const v = calc(t, x1, x2)
            if (Math.abs(v - x) < 1e-7) break
            if (v < x) lo = t
            else hi = t
            t = (lo + hi) / 2
        }
        return calc(t, y1, y2)
    }
}

const easeCache = new Map<string, (t: number) => number>()
function ease(kf: any, dim: number, u: number): number {
    const o = kf.o
    const i = kf.i
    if (!o || !i) return u
    const pick = (v: any) =>
        Array.isArray(v) ? (v[dim] !== undefined ? v[dim] : v[0]) : v
    const x1 = pick(o.x)
    const y1 = pick(o.y)
    const x2 = pick(i.x)
    const y2 = pick(i.y)
    const key = x1 + "," + y1 + "," + x2 + "," + y2
    let fn = easeCache.get(key)
    if (!fn) {
        fn = bezierEasing(x1, y1, x2, y2)
        easeCache.set(key, fn)
    }
    return fn(u)
}

function cubic(p0: number, p1: number, p2: number, p3: number, t: number) {
    const m = 1 - t
    return (
        m * m * m * p0 +
        3 * m * m * t * p1 +
        3 * m * t * t * p2 +
        t * t * t * p3
    )
}

// Point along a spatial bezier at a fraction of its arc length.
function spatial(
    a: number[],
    b: number[],
    to: number[],
    ti: number[],
    f: number
) {
    const N = 150
    const pts: number[][] = []
    const len: number[] = [0]
    for (let k = 0; k <= N; k++) {
        const t = k / N
        const p = a.map((_, d) =>
            cubic(a[d], a[d] + (to[d] || 0), b[d] + (ti[d] || 0), b[d], t)
        )
        if (k > 0) {
            const q = pts[k - 1]
            len.push(len[k - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]))
        }
        pts.push(p)
    }
    const target = f * len[N]
    if (target <= 0) return pts[0]
    if (target >= len[N]) return pts[N]
    let k = 1
    while (len[k] < target) k++
    const r = (target - len[k - 1]) / (len[k] - len[k - 1] || 1)
    return pts[k - 1].map((v, d) => v + (pts[k][d] - v) * r)
}

function lerpShape(a: any, b: any, u: number) {
    const mix = (x: number[][], y: number[][]) =>
        x.map((p, k) => [
            p[0] + (y[k][0] - p[0]) * u,
            p[1] + (y[k][1] - p[1]) * u,
        ])
    return { c: a.c, v: mix(a.v, b.v), i: mix(a.i, b.i), o: mix(a.o, b.o) }
}

// Value of an animatable property at frame f.
function value(p: any, f: number): any {
    if (!p) return undefined
    if (!p.a) return p.k
    const k = p.k
    if (f <= k[0].t) return k[0].s
    const last = k[k.length - 1]
    if (f >= last.t) return last.s !== undefined ? last.s : k[k.length - 2].e
    let n = 0
    while (n < k.length - 2 && k[n + 1].t <= f) n++
    const a = k[n]
    const b = k[n + 1]
    const from = a.s
    const to = a.e !== undefined ? a.e : b.s
    if (a.h === 1) return from
    const u = (f - a.t) / (b.t - a.t)
    if (from[0] && typeof from[0] === "object")
        return [lerpShape(from[0], to[0], ease(a, 0, u))]
    const hasPath =
        a.to &&
        a.ti &&
        (a.to.some((v: number) => v !== 0) || a.ti.some((v: number) => v !== 0))
    if (hasPath) {
        const pt = spatial(from, to, a.to, a.ti, ease(a, 0, u))
        return from.map((v: number, d: number) =>
            d < pt.length ? pt[d] : v + (to[d] - v) * ease(a, 0, u)
        )
    }
    return from.map((v: number, d: number) => v + (to[d] - v) * ease(a, d, u))
}
const num = (p: any, f: number, d = 0) => {
    const v = value(p, f)
    return Array.isArray(v) ? v[0] : v === undefined ? d : v
}

// 2D affine matrix [a, b, c, d, e, f] (same layout as SVG matrix()).
type M = number[]
const mul = (m: M, n: M): M => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
]
function transform(t: any, f: number): M {
    const a = value(t.a, f) || [0, 0]
    const p = value(t.p, f) || [0, 0]
    const s = value(t.s, f) || [100, 100]
    const r = (num(t.r, f) * Math.PI) / 180
    const cos = Math.cos(r)
    const sin = Math.sin(r)
    let m: M = [1, 0, 0, 1, p[0], p[1]]
    m = mul(m, [cos, sin, -sin, cos, 0, 0])
    m = mul(m, [s[0] / 100, 0, 0, s[1] / 100, 0, 0])
    m = mul(m, [1, 0, 0, 1, -a[0], -a[1]])
    return m
}
const apply = (m: M, x: number, y: number) => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
]

function ellipse(it: any, f: number) {
    const p = value(it.p, f)
    const s = value(it.s, f)
    const [x, y] = p
    const w = s[0] / 2
    const h = s[1] / 2
    const cw = it.d !== 3 ? 1 : -1
    const v = [
        [x, y - h],
        [x + cw * w, y],
        [x, y + h],
        [x - cw * w, y],
    ]
    const o = [
        [x + cw * w * KAPPA, y - h],
        [x + cw * w, y + h * KAPPA],
        [x - cw * w * KAPPA, y + h],
        [x - cw * w, y - h * KAPPA],
    ]
    const i = [
        [x - cw * w * KAPPA, y - h],
        [x + cw * w, y - h * KAPPA],
        [x + cw * w * KAPPA, y + h],
        [x - cw * w, y + h * KAPPA],
    ]
    return { c: true, v, i, o }
}

function rect(it: any, f: number) {
    const [x, y] = value(it.p, f)
    const s = value(it.s, f)
    const w = s[0] / 2
    const h = s[1] / 2
    const r = Math.min(w, h, num(it.r, f))
    const c = r * (1 - KAPPA)
    const T: number[][][] = [] // [v, o, i]
    const add = (
        vx: number,
        vy: number,
        ox: number,
        oy: number,
        ix: number,
        iy: number
    ) =>
        T.push([
            [vx, vy],
            [ox, oy],
            [ix, iy],
        ])
    if (it.d === 2 || it.d === 1 || it.d === undefined) {
        add(x + w, y - h + r, x + w, y - h + r, x + w, y - h + c)
        add(x + w, y + h - r, x + w, y + h - c, x + w, y + h - r)
        if (r !== 0) {
            add(x + w - r, y + h, x + w - r, y + h, x + w - c, y + h)
            add(x - w + r, y + h, x - w + c, y + h, x - w + r, y + h)
            add(x - w, y + h - r, x - w, y + h - r, x - w, y + h - c)
            add(x - w, y - h + r, x - w, y - h + c, x - w, y - h + r)
            add(x - w + r, y - h, x - w + r, y - h, x - w + c, y - h)
            add(x + w - r, y - h, x + w - c, y - h, x + w - r, y - h)
        } else {
            add(x - w, y + h, x - w + c, y + h, x - w, y + h)
            add(x - w, y - h, x - w, y - h + c, x - w, y - h)
        }
    } else {
        add(x + w, y - h + r, x + w, y - h + c, x + w, y - h + r)
        if (r !== 0) {
            add(x + w - r, y - h, x + w - r, y - h, x + w - c, y - h)
            add(x - w + r, y - h, x - w + c, y - h, x - w + r, y - h)
            add(x - w, y - h + r, x - w, y - h + r, x - w, y - h + c)
            add(x - w, y + h - r, x - w, y + h - c, x - w, y + h - r)
            add(x - w + r, y + h, x - w + r, y + h, x - w + c, y + h)
            add(x + w - r, y + h, x + w - c, y + h, x + w - r, y + h)
            add(x + w, y + h - r, x + w, y + h - r, x + w, y + h - c)
        } else {
            add(x - w, y - h, x - w + c, y - h, x - w, y - h)
            add(x - w, y + h, x - w, y + h - c, x - w, y + h)
            add(x + w, y + h, x + w - c, y + h, x + w, y + h)
        }
    }
    return {
        c: true,
        v: T.map((q) => q[0]),
        o: T.map((q) => q[1]),
        i: T.map((q) => q[2]),
    }
}

// Shape (with tangents relative to vertices) -> absolute cubic segments, transformed.
function toSegments(sh: any, m: M) {
    const n = sh.v.length
    const segs: number[][] = []
    const P = (k: number) => apply(m, sh.v[k][0], sh.v[k][1])
    const O = (k: number) =>
        apply(m, sh.v[k][0] + sh.o[k][0], sh.v[k][1] + sh.o[k][1])
    const I = (k: number) =>
        apply(m, sh.v[k][0] + sh.i[k][0], sh.v[k][1] + sh.i[k][1])
    const count = sh.c ? n : n - 1
    for (let k = 0; k < count; k++) {
        const j = (k + 1) % n
        segs.push([...P(k), ...O(k), ...I(j), ...P(j)])
    }
    return segs
}
// Ellipse and rect store absolute tangent points; convert to relative.
const relative = (sh: any) => ({
    c: sh.c,
    v: sh.v,
    o: sh.o.map((p: number[], k: number) => [
        p[0] - sh.v[k][0],
        p[1] - sh.v[k][1],
    ]),
    i: sh.i.map((p: number[], k: number) => [
        p[0] - sh.v[k][0],
        p[1] - sh.v[k][1],
    ]),
})

function segLen(s: number[]) {
    let l = 0
    let px = s[0]
    let py = s[1]
    for (let k = 1; k <= 24; k++) {
        const t = k / 24
        const x = cubic(s[0], s[2], s[4], s[6], t)
        const y = cubic(s[1], s[3], s[5], s[7], t)
        l += Math.hypot(x - px, y - py)
        px = x
        py = y
    }
    return l
}

const r2 = (v: number) => Math.round(v * 100) / 100
function pathD(segs: number[][], closed: boolean) {
    if (!segs.length) return ""
    let d = "M" + r2(segs[0][0]) + " " + r2(segs[0][1])
    for (const s of segs) d += "C" + s.slice(2).map(r2).join(" ")
    return closed ? d + "Z" : d
}

// Trim paths ("simultaneously"): visible parts as [start, end] fractions of one path.
function trimRanges(tm: any, f: number): number[][] | null {
    let o = (num(tm.o, f) % 360) / 360
    if (o < 0) o += 1
    const cl = (v: number) => Math.min(1, Math.max(0, v))
    let s = cl(num(tm.s, f) / 100) + o
    let e = cl(num(tm.e, f) / 100) + o
    if (s > e) [s, e] = [e, s]
    s = Math.round(s * 10000) / 10000
    e = Math.round(e * 10000) / 10000
    if (s === e) return []
    if ((s === 0 && e === 1) || (s === 1 && e === 0)) return null
    const out: number[][] = []
    if (e <= 1) out.push([s, e])
    else if (s >= 1) out.push([s - 1, e - 1])
    else {
        out.push([s, 1])
        out.push([0, e - 1])
    }
    return out
}

function renderFrame(data: any, frame: number): string {
    const f = frame
    let out = ""
    const layers = data.layers
    for (let li = layers.length - 1; li >= 0; li--) {
        const L = layers[li]
        if (L.hd || L.ty !== 4 || f < L.ip || f >= L.op) continue
        // Keyframe times in these files are in composition time (lottie-web cancels st out).
        const lf = f
        const lm = transform(L.ks, lf)
        const lo = num(L.ks.o, lf, 100) / 100
        let body = ""
        // Walk an item list; trims later in the list apply to paths earlier in it.
        const walk = (items: any[], m: M, op: number, trims: any[]) => {
            const paths: { segs: number[][]; closed: boolean; trims: any[] }[] =
                []
            for (let k = 0; k < items.length; k++) {
                const it = items[k]
                if (it.hd) continue
                const later = items
                    .slice(k + 1)
                    .filter((x: any) => x.ty === "tm" && !x.hd)
                const allTrims = later.concat(trims)
                if (it.ty === "gr") {
                    const tr = it.it.find((x: any) => x.ty === "tr")
                    const gm = tr ? mul(m, transform(tr, lf)) : m
                    const go = tr ? num(tr.o, lf, 100) / 100 : 1
                    walk(it.it, gm, op * go, allTrims)
                } else if (it.ty === "sh" || it.ty === "el" || it.ty === "rc") {
                    const sh =
                        it.ty === "sh"
                            ? value(it.ks, lf)
                            : relative(
                                  it.ty === "el"
                                      ? ellipse(it, lf)
                                      : rect(it, lf)
                              )
                    const shape = Array.isArray(sh) ? sh[0] : sh
                    paths.push({
                        segs: toSegments(shape, m),
                        closed: !!shape.c,
                        trims: allTrims,
                    })
                } else if (it.ty === "st") {
                    const c = value(it.c, lf)
                    const so = (num(it.o, lf, 100) / 100) * op
                    const w = num(it.w, lf, 1)
                    const cap = ["butt", "butt", "round", "square"][it.lc || 1]
                    const join = ["miter", "miter", "round", "bevel"][
                        it.lj || 1
                    ]
                    const col =
                        "rgb(" +
                        [0, 1, 2].map((d) => Math.round(c[d] * 255)).join(",") +
                        ")"
                    for (const p of paths) {
                        let ranges: number[][] | null = null
                        for (const t of p.trims) {
                            ranges = trimRanges(t, lf)
                            break
                        }
                        if (ranges && !ranges.length) continue
                        let dash = ""
                        let segs = p.segs
                        let closed = p.closed
                        if (ranges) {
                            const total = p.segs
                                .map(segLen)
                                .reduce((a, b) => a + b, 0)
                            if (total <= 0) continue
                            let rs = ranges.slice().sort((a, b) => a[0] - b[0])
                            // A range that wraps past the start of a closed path: draw the path
                            // twice as one open line so the corner at the seam keeps its join.
                            if (
                                closed &&
                                rs.length === 2 &&
                                rs[0][0] === 0 &&
                                rs[1][1] === 1
                            ) {
                                rs = [[rs[1][0], 1 + rs[0][1]]]
                                segs = p.segs.concat(p.segs)
                                closed = false
                            }
                            const pat: number[] = []
                            for (let q = 0; q < rs.length; q++) {
                                const gap =
                                    q + 1 < rs.length
                                        ? rs[q + 1][0] - rs[q][1]
                                        : 2
                                pat.push(
                                    (rs[q][1] - rs[q][0]) * total,
                                    gap * total
                                )
                            }
                            dash =
                                ' stroke-dasharray="' +
                                pat.map((v) => r2(Math.max(v, 0))).join(" ") +
                                '"' +
                                ' stroke-dashoffset="' +
                                r2(-rs[0][0] * total) +
                                '"'
                        }
                        body +=
                            '<path d="' +
                            pathD(segs, closed) +
                            '" fill="none" stroke="' +
                            col +
                            '"' +
                            ' stroke-width="' +
                            r2(w) +
                            '" stroke-linecap="' +
                            cap +
                            '" stroke-linejoin="' +
                            join +
                            '"' +
                            ' stroke-miterlimit="' +
                            (it.ml || 4) +
                            '"' +
                            (so < 1 ? ' stroke-opacity="' + r2(so) + '"' : "") +
                            dash +
                            "/>"
                    }
                }
            }
        }
        walk(L.shapes, [1, 0, 0, 1, 0, 0], 1, [])
        if (!body) continue
        out +=
            '<g transform="matrix(' +
            lm.map((v) => r2(v * 1000) / 1000).join(",") +
            ')"' +
            (lo < 1 ? ' opacity="' + r2(lo) + '"' : "") +
            ">" +
            body +
            "</g>"
    }
    return out
}

// Small player with the parts of the lottie-web API the component uses.
class MiniPlayer {
    data: any
    svg: SVGSVGElement
    totalFrames: number
    currentFrame = 0
    direction = 1
    loop: boolean
    seg: number[] | null = null
    raf = 0
    last = 0
    constructor(container: HTMLElement, data: any, loop: boolean) {
        this.data = data
        this.loop = loop
        this.totalFrames = data.op - data.ip
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        )
        svg.setAttribute("viewBox", "0 0 " + data.w + " " + data.h)
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
        svg.setAttribute("width", "100%")
        svg.setAttribute("height", "100%")
        svg.style.display = "block"
        container.appendChild(svg)
        this.svg = svg
        this.draw()
    }
    draw() {
        this.svg.innerHTML = renderFrame(
            this.data,
            this.data.ip + this.currentFrame
        )
    }
    bounds() {
        return this.seg ? this.seg : [0, this.totalFrames]
    }
    goToAndStop(fr: number) {
        this.stop()
        this.seg = null
        this.currentFrame = Math.max(0, Math.min(fr, this.totalFrames - 0.01))
        this.draw()
    }
    goToAndPlay(fr: number) {
        this.seg = null
        this.currentFrame = fr
        this.direction = 1
        this.play()
    }
    setDirection(d: number) {
        this.direction = d < 0 ? -1 : 1
    }
    playSegments(s: number[]) {
        this.seg = [s[0], s[1]]
        this.currentFrame = s[0]
        this.direction = 1
        this.play()
    }
    play() {
        cancelAnimationFrame(this.raf)
        this.last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(100, now - this.last)
            this.last = now
            const [a, b] = this.bounds()
            let fr =
                this.currentFrame +
                ((dt * this.data.fr) / 1000) * this.direction
            let done = false
            if (this.direction > 0 && fr >= b - 0.01) {
                if (this.loop) fr = a + (fr - b)
                else {
                    fr = b - 0.01
                    done = true
                }
            } else if (this.direction < 0 && fr <= a) {
                if (this.loop) fr = b - (a - fr)
                else {
                    fr = a
                    done = true
                }
            }
            this.currentFrame = fr
            this.draw()
            if (!done) this.raf = requestAnimationFrame(tick)
        }
        this.raf = requestAnimationFrame(tick)
    }
    stop() {
        cancelAnimationFrame(this.raf)
    }
    destroy() {
        this.stop()
        this.svg.remove()
    }
}

const LINE = [0.949, 0.945, 0.929] // #F2F1ED in the source files
const ACCENT = [1, 0.29, 0.11] // #FF4A1C in the source files
const THEMES: Record<string, string> = { dark: "#F2F1ED", light: "#121212" }

function toRgb(color: string): number[] {
    const c = (color || "").trim()
    let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (m) {
        let h = m[1]
        if (h.length === 3)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    }
    m = c.match(/rgba?\(([^)]+)\)/i)
    if (m)
        return m[1]
            .split(",")
            .slice(0, 3)
            .map((v) => parseFloat(v) / 255)
    return [0, 0, 0]
}

function recolor(data: any, line: number[], accent: number[]) {
    const copy = JSON.parse(JSON.stringify(data))
    const near = (k: number[], ref: number[]) =>
        ref.every((v, i) => Math.abs(k[i] - v) < 0.02)
    const walk = (node: any) => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (!node || typeof node !== "object") return
        const k = node.c && node.c.k
        if (
            (node.ty === "fl" || node.ty === "st") &&
            Array.isArray(k) &&
            typeof k[0] === "number"
        ) {
            if (near(k, LINE)) node.c.k = [...line, k[3] ?? 1]
            else if (near(k, ACCENT)) node.c.k = [...accent, k[3] ?? 1]
        }
        Object.values(node).forEach(walk)
    }
    walk(copy)
    return copy
}

const AUTO: Record<string, string> = {
    success: "appear",
    error: "appear",
    copy: "copy",
    checkbox: "toggle",
    refresh: "click",
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 64
 * @framerIntrinsicHeight 64
 */
export default function ZeltriumMicroInteraction(props) {
    const {
        animation = "checkbox",
        theme = "dark",
        lineColor = "#F2F1ED",
        accentColor = "#FF4A1C",
        trigger = "auto",
        hold = 1000,
        label = "",
        onClick,
        style,
    } = props
    const box = useRef<HTMLDivElement>(null)
    const anim = useRef<any>(null)
    const total = useRef(0)
    const on = useRef(false)
    const busy = useRef(false)
    const [pressed, setPressed] = useState(false)
    const mode = trigger === "auto" ? AUTO[animation] : trigger
    // True on the canvas, in thumbnails and in exports: show one still frame there.
    const isStatic = useIsStaticRenderer()
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            timers.current = timers.current.filter((t) => t !== id)
            fn()
        }, ms)
        timers.current.push(id)
    }
    const clearTimers = () => {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }

    const data = useMemo(() => {
        const line = toRgb(theme === "custom" ? lineColor : THEMES[theme])
        return recolor(ANIMS[animation], line, toRgb(accentColor))
    }, [animation, theme, lineColor, accentColor])

    useEffect(() => {
        let alive = true
        let io: IntersectionObserver | null = null
        on.current = false
        busy.current = false
        setPressed(false)
        ;(() => {
            if (!alive || !box.current) return
            const a = new MiniPlayer(box.current, data, mode === "loop")
            anim.current = a
            total.current = a.totalFrames
            const last = a.totalFrames - 1
            if (isStatic) {
                const shown = animation === "success" || animation === "error"
                a.goToAndStop(shown ? last : 0)
                return
            }
            if (mode === "loop") a.play()
            if (mode === "appear") {
                a.goToAndStop(0)
                io = new IntersectionObserver(
                    (entries) => {
                        if (entries.some((e) => e.isIntersecting)) {
                            a.goToAndPlay(0)
                            io && io.disconnect()
                        }
                    },
                    { threshold: 0.6 }
                )
                io.observe(box.current)
            }
        })()
        return () => {
            alive = false
            clearTimers()
            io && io.disconnect()
            anim.current && anim.current.destroy()
            anim.current = null
        }
    }, [data, mode, isStatic, animation])

    const handleClick = (e) => {
        onClick && onClick(e)
        const a = anim.current
        if (!a || isStatic) return
        if (mode === "toggle") {
            on.current = !on.current
            setPressed(on.current)
            a.setDirection(on.current ? 1 : -1)
            a.play()
        } else if (mode === "copy") {
            if (busy.current) return
            busy.current = true
            a.playSegments([0, 15])
            later(() => {
                a.playSegments([15, total.current])
                later(() => (busy.current = false), 400)
            }, 500 + hold)
        } else if (mode === "click" || mode === "appear") {
            a.goToAndPlay(0)
        }
    }
    const enter = () => {
        if (mode !== "hover" || !anim.current || isStatic) return
        anim.current.setDirection(1)
        anim.current.play()
    }
    const leave = () => {
        if (mode !== "hover" || !anim.current || isStatic) return
        anim.current.setDirection(-1)
        anim.current.play()
    }

    const interactive = mode === "toggle" || mode === "copy" || mode === "click"
    return (
        <div
            ref={box}
            role={interactive ? "button" : "img"}
            tabIndex={interactive ? 0 : undefined}
            aria-label={label || animation}
            aria-pressed={mode === "toggle" ? pressed : undefined}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    handleClick(e)
                }
            }}
            onMouseEnter={enter}
            onMouseLeave={leave}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                cursor: interactive ? "pointer" : undefined,
                outline: "none",
            }}
        />
    )
}

ZeltriumMicroInteraction.defaultProps = {
    animation: "checkbox",
    theme: "dark",
    lineColor: "#F2F1ED",
    accentColor: "#FF4A1C",
    trigger: "auto",
    hold: 1000,
    label: "",
}

addPropertyControls(ZeltriumMicroInteraction, {
    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["checkbox", "copy", "success", "error", "refresh"],
        optionTitles: ["Checkbox", "Copy", "Success", "Error", "Refresh"],
        defaultValue: "checkbox",
    },
    theme: {
        type: ControlType.Enum,
        title: "Lines",
        options: ["dark", "light", "custom"],
        optionTitles: ["For dark bg", "For light bg", "Custom"],
        defaultValue: "dark",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "#F2F1ED",
        hidden: (p) => p.theme !== "custom",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FF4A1C",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Play",
        options: ["auto", "toggle", "copy", "click", "hover", "appear", "loop"],
        optionTitles: [
            "Auto (best for this one)",
            "Click: on / off",
            "Click: copy, then reset",
            "Click: play once",
            "Hover",
            "When visible",
            "Loop",
        ],
        defaultValue: "auto",
    },
    hold: {
        type: ControlType.Number,
        title: "Hold (ms)",
        min: 0,
        max: 5000,
        step: 100,
        defaultValue: 1000,
        hidden: (p) =>
            !(
                p.trigger === "copy" ||
                (p.trigger === "auto" && p.animation === "copy")
            ),
    },
    label: {
        type: ControlType.String,
        title: "A11y label",
        placeholder: "e.g. Copy code",
        defaultValue: "",
    },
    onClick: { type: ControlType.EventHandler },
})
