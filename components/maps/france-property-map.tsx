import * as React from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

// ───────────────────────── boundaries ─────────────────────────
const DATA_REV = "5c25134028196d43ce97b5071934fd0cfc92f09f"
const levelSources = (level: string) =>
    [DATA_REV, "main"].map(
        (rev) =>
            `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${rev}/releaseData/gbOpen/FRA/${level}/geoBoundaries-FRA-${level}_simplified.topojson`
    )
const PROVINCE_SOURCES = levelSources("ADM1")
const REGION_SOURCES = levelSources("ADM2")
const CONTEXT_SOURCES = [
    "https://cdn.jsdelivr.net/npm/sane-topojson@4.0.0/dist/europe_50m.json",
    "https://unpkg.com/sane-topojson@4.0.0/dist/europe_50m.json",
]

const TO_RAD = Math.PI / 180
const UNITS_PER_RAD = 6000
const KM_PER_UNIT = 6371 / UNITS_PER_RAD
const DEEPEST = 120 // × overview scale — deep enough for Paris arrondissements

// Albers equal-area on parallels 44° and 49°, centred on the 2.5° meridian
const toMap = (() => {
    const a = 44 * TO_RAD
    const b = 49 * TO_RAD
    const meridian = 2.5 * TO_RAD
    const n = (Math.sin(a) + Math.sin(b)) / 2
    const C = Math.cos(a) * Math.cos(a) + 2 * n * Math.sin(a)
    const rho = (phi: number) => Math.sqrt(C - 2 * n * Math.sin(phi)) / n
    const rhoMid = rho(46.5 * TO_RAD)
    return (lng: number, lat: number): [number, number] => {
        const r = rho(lat * TO_RAD)
        const t = n * (lng * TO_RAD - meridian)
        return [
            UNITS_PER_RAD * r * Math.sin(t),
            -UNITS_PER_RAD * (rhoMid - r * Math.cos(t)),
        ]
    }
})()

// the slice of western Europe worth drawing around France
const inFrame = (lng: number, lat: number) =>
    lng > -12 && lng < 17 && lat > 36 && lat < 56

type Area = {
    id: string
    name: string
    d: string
    rings: number[][][]
    box: number[]
    anchor: number[]
    area: number
}

type Topo = { geo: number[][][]; plane: number[][][] }
type ProvinceSheet = {
    provinces: Area[]
    coast: string
    shelfCoast: string
    neighbours: string
    lakes: string
}
type RegionBook = {
    topo: Topo
    geoms: any[]
    made?: Map<string, { areas: Area[]; borders: string }>
}

function thinRun(r: number[][], gap: number) {
    const out = [r[0]]
    for (let i = 1; i < r.length; i++) {
        const last = out[out.length - 1]
        if ((r[i][0] - last[0]) ** 2 + (r[i][1] - last[1]) ** 2 >= gap * gap)
            out.push(r[i])
    }
    if (out[out.length - 1] !== r[r.length - 1]) out.push(r[r.length - 1])
    return out
}

function decode(t: any, gap: number): Topo {
    const tf = t.transform
    const geo: number[][][] = []
    const plane: number[][][] = []
    for (const arc of t.arcs as number[][][]) {
        let qx = 0
        let qy = 0
        const g: number[][] = []
        const p: number[][] = []
        for (const pt of arc) {
            let lng = pt[0]
            let lat = pt[1]
            if (tf) {
                qx += pt[0]
                qy += pt[1]
                lng = qx * tf.scale[0] + tf.translate[0]
                lat = qy * tf.scale[1] + tf.translate[1]
            }
            g.push([lng, lat])
            p.push(toMap(lng, lat))
        }
        geo.push(g)
        // drop sub-pixel vertices per arc, so shared borders stay identical
        plane.push(p.length > 4 ? thinRun(p, gap) : p)
    }
    return { geo, plane }
}

function chain(arcs: number[][][], refs: number[]) {
    const out: number[][] = []
    for (const ref of refs) {
        const run = ref < 0 ? arcs[~ref].slice().reverse() : arcs[ref]
        for (let k = out.length ? 1 : 0; k < run.length; k++) out.push(run[k])
    }
    return out
}

function boxOf(pts: number[][]) {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const p of pts) {
        if (p[0] < b[0]) b[0] = p[0]
        if (p[1] < b[1]) b[1] = p[1]
        if (p[0] > b[2]) b[2] = p[0]
        if (p[1] > b[3]) b[3] = p[1]
    }
    return b
}

function pathOf(r: number[][], close = true) {
    let d = ""
    for (let i = 0; i < r.length; i++)
        d += (i ? "L" : "M") + r[i][0].toFixed(1) + " " + r[i][1].toFixed(1)
    return close ? d + "Z" : d
}

function polys(g: any): number[][][] {
    if (g.type === "Polygon") return [g.arcs]
    if (g.type === "MultiPolygon") return g.arcs
    return []
}

function massOf(r: number[][]) {
    let a = 0
    let cx = 0
    let cy = 0
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]
        a += f
        cx += (r[j][0] + r[i][0]) * f
        cy += (r[j][1] + r[i][1]) * f
    }
    if (!a) return { area: 0, x: r[0][0], y: r[0][1] }
    return { area: Math.abs(a / 2), x: cx / (3 * a), y: cy / (3 * a) }
}

function toArea(g: any, topo: Topo, id: string, name: string): Area | null {
    const rings: number[][][] = []
    let main = { area: -1, x: 0, y: 0 }
    for (const poly of polys(g))
        poly.forEach((refs: any, ri: number) => {
            const r = chain(topo.plane, refs)
            if (r.length < 3) return
            rings.push(r)
            if (ri === 0) {
                const m = massOf(r)
                if (m.area > main.area) main = m
            }
        })
    if (!rings.length) return null
    return {
        id,
        name,
        d: rings.map((r) => pathOf(r)).join(""),
        rings,
        box: boxOf(rings.flat()),
        anchor: [main.x, main.y],
        area: main.area,
    }
}

// short, familiar region names (official ones are long)
const PROVINCE_NAMES: Record<string, string> = {
    "FR-IDF": "Île-de-France",
    "FR-CVL": "Centre-Val de Loire",
    "FR-BFC": "Bourgogne-Franche-Comté",
    "FR-NOR": "Normandie",
    "FR-HDF": "Hauts-de-France",
    "FR-GES": "Grand Est",
    "FR-PDL": "Pays de la Loire",
    "FR-BRE": "Bretagne",
    "FR-NAQ": "Nouvelle-Aquitaine",
    "FR-OCC": "Occitanie",
    "FR-ARA": "Auvergne-Rhône-Alpes",
    "FR-PAC": "Provence-Alpes-Côte d'Azur",
    "FR-20R": "Corse",
}

// label anchors that read better than a geometric centroid
const LABEL_SPOTS: Record<string, [number, number]> = {
    "FR-PAC": [6.05, 43.95],
    "FR-NAQ": [0.2, 45.45],
    "FR-OCC": [2.2, 43.75],
    "FR-HDF": [2.75, 49.85],
    "FR-NOR": [0.25, 49.1],
}

const touchesFrame = (pts: number[][]) => pts.some((p) => inFrame(p[0], p[1]))

type Context = { neighbours: string; lakes: string }

function readProvinces(raw: any): ProvinceSheet {
    const topo = decode(raw, 0.06)
    const provinces: Area[] = []
    const uses = new Map<number, number>()
    const list = raw.objects[Object.keys(raw.objects)[0]].geometries as any[]
    list.forEach((g: any, gi: number) => {
        const pr = g.properties || {}
        const id = String(pr.shapeISO || pr.shapeID || gi)
        const a = toArea(
            g,
            topo,
            id,
            PROVINCE_NAMES[id] || String(pr.shapeName || id)
        )
        if (!a) return
        const spot = LABEL_SPOTS[id]
        if (spot) a.anchor = toMap(spot[0], spot[1])
        provinces.push(a)
        for (const poly of polys(g))
            for (const ring of poly)
                for (const ref of ring as any) {
                    const k = ref < 0 ? ~ref : ref
                    uses.set(k, (uses.get(k) || 0) + 1)
                }
    })
    // the country's outline = arcs only one region uses; where it is a land border
    // the neighbouring land is painted over it, so only real shores glow
    let coast = ""
    let shelfCoast = ""
    uses.forEach((count, k) => {
        if (count !== 1) return
        const run = topo.plane[k]
        if (run.length < 2) return
        coast += pathOf(run, false)
        const box = boxOf(run)
        if ((box[2] - box[0]) * (box[3] - box[1]) < 0.6 && run.length < 8)
            return
        const lite = thinRun(run, 0.8)
        if (lite.length > 1) shelfCoast += pathOf(lite, false)
    })
    if (!coast) coast = provinces.map((s) => s.d).join("")
    if (!shelfCoast) shelfCoast = coast
    return { provinces, coast, shelfCoast, neighbours: "", lakes: "" }
}

// neighbouring countries and lakes, drawn quietly for context
function readContext(raw: any): Context {
    const topo = decode(raw, 0.3)
    let neighbours = ""
    for (const g of raw.objects.countries.geometries as any[]) {
        if (g.id === "FRA") continue
        for (const poly of polys(g))
            for (const refs of poly) {
                if (!touchesFrame(chain(topo.geo, refs as any))) continue
                neighbours += pathOf(chain(topo.plane, refs as any))
            }
    }
    let lakes = ""
    for (const g of raw.objects.lakes.geometries as any[])
        for (const poly of polys(g))
            for (const refs of poly) {
                if (!touchesFrame(chain(topo.geo, refs as any))) continue
                lakes += pathOf(chain(topo.plane, refs as any))
            }
    return { neighbours, lakes }
}

// the outline is ready before the context land; the map never waits for it
function useSheet(): ProvinceSheet | null {
    const base = useBoundary(PROVINCE_SOURCES, readProvinces)
    const ctx = useBoundary(CONTEXT_SOURCES, readContext)
    return useMemo(
        () =>
            base
                ? {
                      ...base,
                      neighbours: ctx ? ctx.neighbours : "",
                      lakes: ctx ? ctx.lakes : "",
                  }
                : null,
        [base, ctx]
    )
}

function readRegions(raw: any): RegionBook {
    return {
        topo: decode(raw, 0.06),
        geoms: raw.objects[Object.keys(raw.objects)[0]].geometries,
    }
}

// tidy a few département spellings from the source
const REGION_FIX: Record<string, string> = {
    "Côtes d'Armor": "Côtes-d'Armor",
}
function regionName(raw: string) {
    let s = String(raw || "").trim()
    if (REGION_FIX[s]) s = REGION_FIX[s]
    return s
}

function whichArea(x: number, y: number, list: Area[]) {
    for (const p of list) {
        const b = p.box
        if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue
        let inside = false
        for (const r of p.rings)
            for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
                const yi = r[i][1]
                const yj = r[j][1]
                if (
                    yi > y !== yj > y &&
                    x < ((r[j][0] - r[i][0]) * (y - yi)) / (yj - yi) + r[i][0]
                )
                    inside = !inside
            }
        if (inside) return p.id
    }
    // waterfront points just off a generalised shoreline snap to the nearest province
    let best: string | null = null
    let bd = 36
    for (const p of list) {
        const b = p.box
        if (x < b[0] - 6 || x > b[2] + 6 || y < b[1] - 6 || y > b[3] + 6)
            continue
        for (const r of p.rings)
            for (const q of r) {
                const dd = (q[0] - x) ** 2 + (q[1] - y) ** 2
                if (dd < bd) {
                    bd = dd
                    best = p.id
                }
            }
    }
    return best
}

// economic regions grouped per province, plus only the borders between them
function regionsOf(
    book: RegionBook | null,
    sheet: ProvinceSheet | null,
    provinceId: string | null
) {
    const none = { areas: [] as Area[], borders: "" }
    if (!book || !sheet || !provinceId) return none
    if (!book.made) {
        const made = new Map<string, { areas: Area[]; borders: string }>()
        const owner = new Map<number, string[]>()
        book.geoms.forEach((g: any, gi: number) => {
            const a = toArea(
                g,
                book.topo,
                String((g.properties && g.properties.shapeID) || gi),
                regionName(g.properties && g.properties.shapeName)
            )
            if (!a) return
            const home = whichArea(a.anchor[0], a.anchor[1], sheet.provinces)
            if (!home) return
            const slot = made.get(home) || { areas: [], borders: "" }
            slot.areas.push(a)
            made.set(home, slot)
            for (const poly of polys(g))
                for (const ring of poly)
                    for (const ref of ring as any) {
                        const k = ref < 0 ? ~ref : ref
                        const list = owner.get(k) || []
                        list.push(home)
                        owner.set(k, list)
                    }
        })
        owner.forEach((homes, k) => {
            if (homes.length !== 2 || homes[0] !== homes[1]) return
            const slot = made.get(homes[0])
            if (slot) slot.borders += pathOf(book.topo.plane[k], false)
        })
        book.made = made
    }
    return book.made.get(provinceId) || none
}

const store: Record<string, { value?: any; wait?: Promise<any> }> = {}

function fetchFirst(list: string[], i = 0): Promise<any> {
    return fetch(list[i])
        .then((r) => {
            if (!r.ok) throw new Error("boundary fetch failed")
            return r.json()
        })
        .catch((e) => {
            if (i + 1 < list.length) return fetchFirst(list, i + 1)
            throw e
        })
}

function loadOnce<T>(list: string[], read: (raw: any) => T): Promise<T> {
    const slot = store[list[0]] || (store[list[0]] = {})
    if (slot.value) return Promise.resolve(slot.value)
    if (!slot.wait)
        slot.wait = fetchFirst(list)
            .then((raw) => (slot.value = read(raw)))
            .catch((e) => {
                slot.wait = undefined
                throw e
            })
    return slot.wait
}

function useBoundary<T>(list: string[], read: (raw: any) => T, wanted = true) {
    const [v, setV] = useState<T | null>(
        () => (store[list[0]] && store[list[0]].value) || null
    )
    useEffect(() => {
        if (v || !wanted) return
        let alive = true
        loadOnce(list, read)
            .then((r) => alive && setV(r))
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [wanted])
    return v
}

// ───────────────────────── towns ─────────────────────────
// [name, lat, lng, prominence 1–3]
const TOWNS: [string, number, number, number][] = [
    ["Paris", 48.8566, 2.3522, 1],
    ["Marseille", 43.2965, 5.3698, 1],
    ["Lyon", 45.764, 4.8357, 1],
    ["Toulouse", 43.6047, 1.4442, 1],
    ["Nice", 43.7102, 7.262, 1],
    ["Nantes", 47.2184, -1.5536, 1],
    ["Strasbourg", 48.5734, 7.7521, 1],
    ["Montpellier", 43.6108, 3.8767, 1],
    ["Bordeaux", 44.8378, -0.5792, 1],
    ["Lille", 50.6292, 3.0573, 1],
    ["Rennes", 48.1173, -1.6778, 1],
    ["Rouen", 49.4432, 1.0999, 1],
    ["Dijon", 47.322, 5.0415, 1],
    ["Orléans", 47.9029, 1.9093, 1],
    ["Ajaccio", 41.9192, 8.7386, 1],
    ["Clermont-Ferrand", 45.7772, 3.087, 1],
    ["Reims", 49.2583, 4.0317, 2],
    ["Le Havre", 49.4944, 0.1079, 2],
    ["Saint-Étienne", 45.4397, 4.3872, 2],
    ["Toulon", 43.1242, 5.928, 2],
    ["Grenoble", 45.1885, 5.7245, 2],
    ["Angers", 47.4784, -0.5632, 2],
    ["Nîmes", 43.8367, 4.3601, 2],
    ["Le Mans", 48.0061, 0.1996, 2],
    ["Aix-en-Provence", 43.5297, 5.4474, 2],
    ["Brest", 48.3904, -4.4861, 2],
    ["Tours", 47.3941, 0.6848, 2],
    ["Amiens", 49.8941, 2.2958, 2],
    ["Limoges", 45.8336, 1.2611, 2],
    ["Perpignan", 42.6887, 2.8948, 2],
    ["Metz", 49.1193, 6.1757, 2],
    ["Besançon", 47.2378, 6.0241, 2],
    ["Caen", 49.1829, -0.3707, 2],
    ["Nancy", 48.6921, 6.1844, 2],
    ["Mulhouse", 47.7508, 7.3359, 2],
    ["Avignon", 43.9493, 4.8055, 2],
    ["Poitiers", 46.5802, 0.3404, 2],
    ["Pau", 43.2951, -0.3708, 2],
    ["La Rochelle", 46.1603, -1.1511, 2],
    ["Bayonne", 43.4929, -1.4748, 2],
    ["Annecy", 45.8992, 6.1294, 2],
    ["Chambéry", 45.5646, 5.9178, 2],
    ["Troyes", 48.2973, 4.0744, 2],
    ["Calais", 50.9513, 1.8587, 2],
    ["Cherbourg", 49.6337, -1.6222, 2],
    ["Quimper", 47.9961, -4.0977, 2],
    ["Lorient", 47.7483, -3.37, 2],
    ["Saint-Brieuc", 48.5136, -2.7653, 2],
    ["Vannes", 47.6582, -2.7608, 2],
    ["Laval", 48.0707, -0.7734, 2],
    ["Bourges", 47.081, 2.3988, 2],
    ["Nevers", 46.9896, 3.159, 2],
    ["Auxerre", 47.7982, 3.5673, 2],
    ["Valence", 44.9334, 4.8924, 2],
    ["Béziers", 43.3442, 3.2158, 2],
    ["Carcassonne", 43.2121, 2.3537, 2],
    ["Rodez", 44.3506, 2.575, 2],
    ["Agen", 44.2033, 0.6163, 2],
    ["Périgueux", 45.1847, 0.7214, 2],
    ["Angoulême", 45.6484, 0.1562, 2],
    ["Niort", 46.3237, -0.4588, 2],
    ["Mont-de-Marsan", 43.8902, -0.4999, 2],
    ["Tarbes", 43.2328, 0.0781, 2],
    ["Gap", 44.5594, 6.0786, 2],
    ["Digne-les-Bains", 44.0925, 6.2356, 2],
    ["Bastia", 42.6977, 9.4508, 2],
    ["Châlons-en-Champagne", 48.9566, 4.3631, 2],
    ["Charleville-Mézières", 49.7621, 4.7262, 2],
    ["Épinal", 48.1724, 6.4496, 2],
    ["Colmar", 48.0794, 7.3585, 2],
    ["Belfort", 47.6397, 6.8638, 2],
    ["Mâcon", 46.3069, 4.8287, 2],
    ["Aurillac", 44.9264, 2.4396, 2],
    ["Le Puy-en-Velay", 45.0434, 3.885, 2],
    ["Cannes", 43.5528, 7.0174, 3],
    ["Antibes", 43.5808, 7.1251, 3],
    ["Menton", 43.7747, 7.4975, 3],
    ["Saint-Tropez", 43.2727, 6.6406, 3],
    ["Arles", 43.6766, 4.6278, 3],
    ["Cassis", 43.2147, 5.5376, 3],
    ["Gordes", 43.9113, 5.2003, 3],
    ["Biarritz", 43.4832, -1.5586, 3],
    ["Saint-Jean-de-Luz", 43.3881, -1.6631, 3],
    ["Arcachon", 44.6586, -1.1689, 3],
    ["Cognac", 45.6958, -0.3287, 3],
    ["Saint-Émilion", 44.8942, -0.1553, 3],
    ["Sarlat-la-Canéda", 44.8897, 1.2165, 3],
    ["Deauville", 49.3571, 0.0694, 3],
    ["Honfleur", 49.4194, 0.2331, 3],
    ["Étretat", 49.7071, 0.2053, 3],
    ["Giverny", 49.0757, 1.5336, 3],
    ["Saint-Malo", 48.6493, -2.0257, 3],
    ["Dinard", 48.6326, -2.0617, 3],
    ["Carnac", 47.5838, -3.0784, 3],
    ["La Baule", 47.2868, -2.3914, 3],
    ["Saumur", 47.26, -0.0769, 3],
    ["Amboise", 47.4128, 0.9822, 3],
    ["Chartres", 48.4439, 1.489, 3],
    ["Fontainebleau", 48.4047, 2.7016, 3],
    ["Versailles", 48.8049, 2.1204, 3],
    ["Saint-Germain-en-Laye", 48.8989, 2.0938, 3],
    ["Boulogne-Billancourt", 48.8397, 2.2399, 3],
    ["Neuilly-sur-Seine", 48.8846, 2.2697, 3],
    ["Montreuil", 48.8638, 2.4485, 3],
    ["Saint-Denis", 48.9362, 2.3574, 3],
    ["Vincennes", 48.8474, 2.4392, 3],
    ["Créteil", 48.7904, 2.4556, 3],
    ["Le Marais", 48.8575, 2.3602, 3],
    ["Montmartre", 48.8867, 2.3431, 3],
    ["Saint-Germain-des-Prés", 48.854, 2.3337, 3],
    ["Chamonix", 45.9237, 6.8694, 3],
    ["Megève", 45.8567, 6.6175, 3],
    ["Courchevel", 45.4154, 6.6342, 3],
    ["Val d'Isère", 45.4485, 6.9806, 3],
    ["Évian-les-Bains", 46.4005, 6.5897, 3],
    ["Beaune", 47.026, 4.84, 3],
    ["Épernay", 49.0405, 3.9592, 3],
    ["Riquewihr", 48.1667, 7.2978, 3],
    ["Villeurbanne", 45.7719, 4.8902, 3],
    ["Annecy-le-Vieux", 45.9196, 6.143, 3],
    ["Uzès", 44.0124, 4.4197, 3],
    ["Collioure", 42.5257, 3.0832, 3],
    ["Albi", 43.9289, 2.1464, 3],
    ["Lourdes", 43.0947, -0.0459, 3],
    ["Porto-Vecchio", 41.5911, 9.2795, 3],
    ["Calvi", 42.5679, 8.7575, 3],
    ["Bonifacio", 41.3874, 9.1593, 3],
]

type Town = {
    name: string
    x: number
    y: number
    rank: number
    state: string | null
    land: string
}

// separate land masses so trunk roads never bridge open water
function landOf(lat: number, lng: number) {
    if (lng > 8.4 && lat < 43.1) return "corse"
    return "main"
}

// ───────────────────────── drawn detail ─────────────────────────
function hash3(a: number, b: number, c: number) {
    let h =
        Math.imul(a | 0, 374761393) ^
        Math.imul(b | 0, 668265263) ^
        Math.imul(c | 0, 1442695041)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
}

function seedOf(text: string) {
    let h = 2166136261
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

// one global warp so street levels line up as the camera changes depth
const RIPPLE = [
    [92, 2.4, 0.9],
    [23, 0.7, 2.6],
    [5.8, 3.9, 4.4],
    [1.45, 1.6, 0.3],
]
function ripple(x: number, y: number) {
    let dx = 0
    let dy = 0
    for (const w of RIPPLE) {
        const f = (2 * Math.PI) / w[0]
        const a = 0.082 / f
        dx += a * Math.sin(y * f + x * f * 0.35 + w[1])
        dy += a * Math.sin(x * f - y * f * 0.31 + w[2])
    }
    return [x + dx, y + dy]
}

function roundShape(pts: number[][]) {
    const n = pts.length
    const mid = (a: number[], b: number[]) => [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
    ]
    let m = mid(pts[n - 1], pts[0])
    let d = "M" + m[0].toFixed(2) + " " + m[1].toFixed(2)
    for (let k = 0; k < n; k++) {
        const p = pts[k]
        m = mid(p, pts[(k + 1) % n])
        d += `Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`
    }
    return d + "Z"
}

const BLOCK = 16
const BLOCK_ON_SCREEN = 34

type Suburb = {
    minor: string
    major: string
    reserves: string
    dams: string
    reach: number
}

function suburb(spots: number[][], level: number, turn: number): Suburb {
    const s = BLOCK / Math.pow(2, level)
    const R = s * 6.5
    const u = [Math.cos(turn), Math.sin(turn)]
    const v = [-u[1], u[0]]
    const step = s / 2.5
    const lines = (du: number[], dv: number[], gap: number) => {
        const runs = new Map<number, number[][]>()
        for (const p of spots) {
            const cu = p[0] * du[0] + p[1] * du[1]
            const cv = p[0] * dv[0] + p[1] * dv[1]
            for (
                let i = Math.ceil((cv - R) / gap);
                i <= Math.floor((cv + R) / gap);
                i++
            ) {
                const off = i * gap - cv
                const half = Math.sqrt(Math.max(0, R * R - off * off))
                if (half < step) continue
                const list = runs.get(i) || []
                list.push([cu - half, cu + half])
                runs.set(i, list)
            }
        }
        const out: { i: number; d: string }[] = []
        runs.forEach((list, i) => {
            list.sort((a, b) => a[0] - b[0])
            const merged: number[][] = []
            for (const r of list) {
                const last = merged[merged.length - 1]
                if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
                else merged.push([r[0], r[1]])
            }
            let d = ""
            for (const [a, b] of merged) {
                const n = Math.max(2, Math.ceil((b - a) / step))
                for (let k = 0; k <= n; k++) {
                    const t = a + ((b - a) * k) / n
                    const q = ripple(
                        dv[0] * i * gap + du[0] * t,
                        dv[1] * i * gap + du[1] * t
                    )
                    d +=
                        (k ? "L" : "M") +
                        q[0].toFixed(2) +
                        " " +
                        q[1].toFixed(2)
                }
            }
            out.push({ i, d })
        })
        return out
    }
    let minor = ""
    let major = ""
    for (const set of [lines(u, v, s), lines(v, [-u[0], -u[1]], s)])
        for (const l of set) {
            if (l.i % 4 === 0) major += l.d
            else minor += l.d
        }
    const cross = turn + 0.66
    const dc = [Math.cos(cross), Math.sin(cross)]
    for (const l of lines(dc, [-dc[1], dc[0]], s * 6)) major += l.d

    let reserves = ""
    let dams = ""
    const used = new Set<string>()
    for (let lv = Math.max(0, level - 2); lv <= level; lv++) {
        const g = BLOCK / Math.pow(2, lv)
        for (const p of spots) {
            const cu = p[0] * u[0] + p[1] * u[1]
            const cv = p[0] * v[0] + p[1] * v[1]
            const i0 = Math.floor((cu - R) / g)
            const i1 = Math.floor((cu + R) / g)
            const j0 = Math.floor((cv - R) / g)
            const j1 = Math.floor((cv + R) / g)
            if ((i1 - i0) * (j1 - j0) > 1600) continue
            for (let i = i0; i <= i1; i++)
                for (let j = j0; j <= j1; j++) {
                    const ca = (i + 0.5) * g
                    const cb = (j + 0.5) * g
                    if ((ca - cu) ** 2 + (cb - cv) ** 2 > R * R) continue
                    const key = lv + ":" + i + ":" + j
                    if (used.has(key)) continue
                    used.add(key)
                    if (hash3(i, j, lv * 13 + 4) > 0.06) continue
                    const wet = hash3(i, j, lv * 13 + 7) < 0.15
                    const a = ca + (hash3(i, j, lv * 13 + 9) - 0.5) * 0.3 * g
                    const b = cb + (hash3(j, i, lv * 13 + 9) - 0.5) * 0.3 * g
                    const rad = g * (0.24 + 0.16 * hash3(i, j, lv * 13 + 11))
                    const pts: number[][] = []
                    for (let k = 0; k < 8; k++) {
                        const t =
                            (k / 8) * Math.PI * 2 +
                            (hash3(i, j, k + lv * 37) - 0.5) * 0.5
                        const rr =
                            rad * (0.72 + 0.42 * hash3(j, i, k + lv * 23))
                        const ua = a + Math.cos(t) * rr
                        const vb = b + Math.sin(t) * rr
                        pts.push(
                            ripple(u[0] * ua + v[0] * vb, u[1] * ua + v[1] * vb)
                        )
                    }
                    if (wet) dams += roundShape(pts)
                    else reserves += roundShape(pts)
                }
        }
    }
    return { minor, major, reserves, dams, reach: R }
}

type Stop = { x: number; y: number; big: boolean }

function highways(nodes: Stop[]) {
    const n = nodes.length
    let major = ""
    let minor = ""
    if (n < 2) return { major, minor }
    const d2 = (a: Stop, b: Stop) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
    const inTree = new Array(n).fill(false)
    const best = new Array(n).fill(Infinity)
    const from = new Array(n).fill(-1)
    best[0] = 0
    const edges: number[][] = []
    for (let it = 0; it < n; it++) {
        let m = -1
        for (let i = 0; i < n; i++)
            if (!inTree[i] && (m < 0 || best[i] < best[m])) m = i
        inTree[m] = true
        if (from[m] >= 0) edges.push([from[m], m])
        for (let i = 0; i < n; i++) {
            if (inTree[i]) continue
            const dd = d2(nodes[m], nodes[i])
            if (dd < best[i]) {
                best[i] = dd
                from[i] = m
            }
        }
    }
    const has = new Set(
        edges.map(([a, b]) => Math.min(a, b) + "-" + Math.max(a, b))
    )
    for (let a = 0; a < n; a++) {
        if (!nodes[a].big) continue
        const near: number[][] = []
        for (let b = 0; b < n; b++)
            if (b !== a && nodes[b].big) near.push([d2(nodes[a], nodes[b]), b])
        near.sort((p, q) => p[0] - q[0])
        for (const [dd, b] of near.slice(0, 2)) {
            const key = Math.min(a, b) + "-" + Math.max(a, b)
            if (has.has(key) || dd > near[0][0] * 3.2) continue
            has.add(key)
            edges.push([a, b])
        }
    }
    for (const [a, b] of edges) {
        const p = nodes[a]
        const q = nodes[b]
        const len = Math.sqrt(d2(p, q))
        if (!len) continue
        const bow =
            (hash3(Math.round(p.x * 10), Math.round(q.y * 10), 3) - 0.5) *
            0.24 *
            len
        const cx = (p.x + q.x) / 2 + (-(q.y - p.y) / len) * bow
        const cy = (p.y + q.y) / 2 + ((q.x - p.x) / len) * bow
        let d = ""
        const steps = Math.max(6, Math.min(40, Math.round(len / 2)))
        for (let k = 0; k <= steps; k++) {
            const t = k / steps
            const x =
                (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * q.x
            const y =
                (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * q.y
            const w = ripple(x, y)
            d += (k ? "L" : "M") + w[0].toFixed(2) + " " + w[1].toFixed(2)
        }
        if (p.big && q.big) major += d
        else minor += d
    }
    return { major, minor }
}

type Caption = {
    key: string
    x: number
    y: number
    text: string
    kind: "town" | "region" | "state"
    rank: number
}

function spaceOut(list: Caption[], k: number, blocks: number[][]) {
    const taken = blocks.slice()
    const out: Caption[] = []
    for (const l of list) {
        const w = l.text.length * 6.7 + (l.kind === "town" ? 16 : 10)
        const x = l.x * k
        const y = l.y * k
        const r =
            l.kind === "town"
                ? [x - 5, y - 8, x + w, y + 8]
                : [x - w / 2, y - 8, x + w / 2, y + 8]
        if (
            taken.some(
                (t) => r[0] < t[2] && r[2] > t[0] && r[1] < t[3] && r[3] > t[1]
            )
        )
            continue
        taken.push(r)
        out.push(l)
    }
    return out
}

const SHALLOWS = [
    { w: 20, o: 0.62 },
    { w: 38, o: 0.44 },
    { w: 60, o: 0.3 },
    { w: 88, o: 0.19 },
    { w: 122, o: 0.1 },
]

// ───────────────────────── listings ─────────────────────────
type Home = {
    image?: { src?: string; alt?: string }
    imageUrl?: string
    title?: string
    address?: string
    tag?: string
    price?: number
    size?: number
    beds?: number
    baths?: number
    latitude?: number
    longitude?: number
    link?: string
}

type Pin = { i: number; home: Home; mx: number; my: number; state: string }
type Tally = { count: number; lo: number; hi: number }

function pinHomes(homes: Home[], states: Area[] | null): Pin[] {
    if (!states) return []
    const out: Pin[] = []
    homes.forEach((home, i) => {
        const lat = Number(home && home.latitude)
        const lng = Number(home && home.longitude)
        if (!isFinite(lat) || !isFinite(lng)) return
        const [mx, my] = toMap(lng, lat)
        const state = whichArea(mx, my, states)
        if (state) out.push({ i, home, mx, my, state })
    })
    return out
}

function tallyStates(pins: Pin[]) {
    const m = new Map<string, Tally>()
    for (const p of pins) {
        const v = Number(p.home.price) || 0
        const t = m.get(p.state)
        if (t) {
            t.count++
            t.lo = Math.min(t.lo, v)
            t.hi = Math.max(t.hi, v)
        } else m.set(p.state, { count: 1, lo: v, hi: v })
    }
    return m
}

function spanOf(list: Area[]) {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const p of list) {
        b[0] = Math.min(b[0], p.box[0])
        b[1] = Math.min(b[1], p.box[1])
        b[2] = Math.max(b[2], p.box[2])
        b[3] = Math.max(b[3], p.box[3])
    }
    return b
}

function shortNum(v: number) {
    return (v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)).replace(
        /\.?0+$/,
        ""
    )
}

function cash(v: number, cur: string, compact: boolean) {
    let body: string
    if (compact && v >= 1e6) body = shortNum(v / 1e6) + "M"
    else if (compact && v >= 1e4) body = shortNum(v / 1e3) + "K"
    else body = Math.round(v).toLocaleString("en-GB")
    return cur + body
}

function phrase(
    t: string,
    vars: Record<string, string | number>,
    words?: { one: string; many: string }
) {
    if (words && vars.count !== undefined)
        vars = {
            ...vars,
            unit: Number(vars.count) === 1 ? words.one : words.many,
        }
    return String(t || "").replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] !== undefined ? String(vars[k]) : ""
    )
}

function imageOf(h: Home) {
    return (h && h.image && h.image.src) || (h && h.imageUrl) || ""
}

// ───────────────────────── props ─────────────────────────
type Copy = {
    one: string
    many: string
    overview: string
    inProvince: string
    back: string
    hoverHint: string
    groupTitle: string
    zoomIn: string
    cta: string
    bedsLabel: string
    bathsLabel: string
    sizeLabel: string
    sizeUnit: string
    mapNote: string
}
type Pricing = { currency: string; suffix: string; compact: boolean }
type Terrain = {
    ocean: string
    shallows: string
    beach: string
    neighbour: string
    land: string
    listed: string
    hover: string
    focus: string
    border: string
    region: string
    highway: string
    street: string
    avenue: string
    reserve: string
    lake: string
    fade: number
}
type Show = {
    shallows: boolean
    neighbours: boolean
    regions: boolean
    roads: boolean
    streets: boolean
    towns: boolean
}
type Markers = {
    countFill: string
    countInk: string
    pinFill: string
    pinInk: string
    pinEdge: string
    activeFill: string
    activeInk: string
    gather: number
}
type Listing = {
    layout: "postcard" | "ticket"
    width: number
    radius: number
    fill: string
    ink: string
    muted: string
    line: string
    ribbon: string
    ribbonInk: string
    heart: string
    buttonFill: string
    buttonInk: string
    newTab: boolean
}
type Chrome = {
    chip: boolean
    zoom: boolean
    north: boolean
    scale: boolean
    units: "km" | "mi"
    wheel: "pinch" | "always" | "off"
    names: boolean
    plate: string
    plateInk: string
}

type Props = {
    homes: Home[]
    copy: Copy
    pricing: Pricing
    terrain: Terrain
    show: Show
    markers: Markers
    listing: Listing
    chrome: Chrome
    glide: number
    radius: number
    titleFont: React.CSSProperties
    uiFont: React.CSSProperties
    labelFont: React.CSSProperties
    style?: React.CSSProperties
}

const COPY: Copy = {
    one: "home",
    many: "homes",
    overview: "{count} {unit} across {provinces} regions",
    inProvince: "{count} {unit} in {province}",
    back: "All regions",
    hoverHint: "Click to explore",
    groupTitle: "{count} {unit} here",
    zoomIn: "Zoom in",
    cta: "View home",
    bedsLabel: "Bedrooms",
    bathsLabel: "Bathrooms",
    sizeLabel: "Living space",
    sizeUnit: "m²",
    mapNote: "Illustrative map · Boundaries IGN, Etalab 2.0",
}
const PRICING: Pricing = { currency: "€", suffix: " /mo", compact: false }
const TERRAIN: Terrain = {
    ocean: "#C7D8E3",
    shallows: "#E3EDF2",
    beach: "#EFE7D8",
    neighbour: "#E4DFD4",
    land: "#F8F4EC",
    listed: "#F1E5CF",
    hover: "#EAD5B1",
    focus: "#F6EEDF",
    border: "#D3C2A4",
    region: "#D9C9AC",
    highway: "#C9573F",
    street: "#E6DBC6",
    avenue: "#DDA48A",
    reserve: "#DDE4C6",
    lake: "#B9CEDB",
    fade: 0.55,
}
const SHOW: Show = {
    shallows: true,
    neighbours: true,
    regions: true,
    roads: true,
    streets: true,
    towns: true,
}
const MARKERS: Markers = {
    countFill: "#1F2B4D",
    countInk: "#FFFFFF",
    pinFill: "#FFFFFF",
    pinInk: "#1F2B4D",
    pinEdge: "rgba(31, 43, 77, 0.14)",
    activeFill: "#C9573F",
    activeInk: "#FFFFFF",
    gather: 58,
}
const LISTING: Listing = {
    layout: "postcard",
    width: 296,
    radius: 18,
    fill: "#FFFDF8",
    ink: "#1F2B4D",
    muted: "#7D7768",
    line: "rgba(31, 43, 77, 0.12)",
    ribbon: "#C9573F",
    ribbonInk: "#FFFFFF",
    heart: "#C9573F",
    buttonFill: "#1F2B4D",
    buttonInk: "#FFFFFF",
    newTab: false,
}
const CHROME: Chrome = {
    chip: true,
    zoom: true,
    north: true,
    scale: true,
    units: "km",
    wheel: "pinch",
    names: true,
    plate: "rgba(255, 252, 246, 0.94)",
    plateInk: "#1F2B4D",
}

const HOMES: Home[] = (
    [
        [
            "Haussmann Apartment",
            "8th arr., Paris",
            "Featured",
            6800,
            142,
            3,
            2,
            48.8744,
            2.3106,
        ],
        [
            "Marais Courtyard Flat",
            "Le Marais, Paris",
            "",
            3900,
            74,
            2,
            1,
            48.8589,
            2.3618,
        ],
        [
            "Montmartre Atelier",
            "Montmartre, Paris",
            "New",
            3200,
            61,
            1,
            1,
            48.8867,
            2.3404,
        ],
        [
            "Left Bank Duplex",
            "Saint-Germain-des-Prés, Paris",
            "",
            7400,
            128,
            3,
            2,
            48.8536,
            2.3326,
        ],
        ["Canal Loft", "10th arr., Paris", "", 2900, 58, 1, 1, 48.8715, 2.3652],
        [
            "Garden Townhouse",
            "Versailles",
            "",
            4600,
            165,
            4,
            3,
            48.8014,
            2.1301,
        ],
        [
            "Riverside Maison",
            "Saint-Germain-en-Laye",
            "",
            5200,
            190,
            5,
            3,
            48.8982,
            2.0901,
        ],
        [
            "Presqu'île Apartment",
            "Presqu'île, Lyon",
            "",
            2400,
            88,
            2,
            1,
            45.7605,
            4.8336,
        ],
        [
            "Croix-Rousse Canut Loft",
            "Croix-Rousse, Lyon",
            "",
            2100,
            96,
            2,
            1,
            45.7745,
            4.8312,
        ],
        [
            "Vieux-Port Flat",
            "Vieux-Port, Marseille",
            "Sea view",
            2300,
            70,
            2,
            1,
            43.2951,
            5.3747,
        ],
        [
            "Corniche Villa",
            "Endoume, Marseille",
            "",
            5600,
            210,
            4,
            3,
            43.2835,
            5.3536,
        ],
        [
            "Promenade Apartment",
            "Carré d'Or, Nice",
            "Sea view",
            3600,
            92,
            2,
            2,
            43.6953,
            7.2657,
        ],
        [
            "Hillside Villa",
            "Cap d'Antibes",
            "Pool",
            12500,
            320,
            5,
            5,
            43.5551,
            7.1265,
        ],
        ["Village Bastide", "Gordes", "", 4800, 240, 4, 3, 43.9113, 5.2003],
        [
            "Chartrons Stone House",
            "Chartrons, Bordeaux",
            "",
            2800,
            128,
            3,
            2,
            44.8551,
            -0.5713,
        ],
        [
            "Vineyard Chartreuse",
            "Saint-Émilion",
            "",
            5900,
            280,
            5,
            4,
            44.8942,
            -0.1553,
        ],
        [
            "Basque Coast House",
            "Biarritz",
            "Surf",
            4400,
            170,
            4,
            3,
            43.4794,
            -1.5592,
        ],
        [
            "Capitole Flat",
            "Capitole, Toulouse",
            "",
            1800,
            72,
            2,
            1,
            43.6045,
            1.4433,
        ],
        [
            "Écusson Apartment",
            "Écusson, Montpellier",
            "",
            1700,
            66,
            2,
            1,
            43.6105,
            3.8753,
        ],
        [
            "Petite France Flat",
            "Petite France, Strasbourg",
            "",
            1900,
            78,
            2,
            1,
            48.5808,
            7.7409,
        ],
        [
            "Vieux-Lille Loft",
            "Vieux-Lille, Lille",
            "",
            1800,
            84,
            2,
            1,
            50.6395,
            3.0633,
        ],
        [
            "Île de Nantes Loft",
            "Île de Nantes, Nantes",
            "New",
            1700,
            82,
            2,
            1,
            47.2063,
            -1.5503,
        ],
        [
            "Walled City House",
            "Intra-Muros, Saint-Malo",
            "Sea view",
            2600,
            118,
            3,
            2,
            48.6497,
            -2.0251,
        ],
        [
            "Chalet by the Slopes",
            "Chamonix",
            "Ski-in",
            8200,
            210,
            5,
            4,
            45.9237,
            6.8694,
        ],
        [
            "Lakeside Apartment",
            "Annecy",
            "Lake view",
            2500,
            86,
            2,
            2,
            45.8992,
            6.1294,
        ],
        ["Old Port Flat", "Bastia", "", 1600, 74, 2, 1, 42.6977, 9.4508],
        [
            "Seafront Villa",
            "Porto-Vecchio",
            "Beach",
            7300,
            230,
            4,
            4,
            41.5911,
            9.2795,
        ],
        ["Harbour Townhouse", "Honfleur", "", 2700, 134, 3, 2, 49.4194, 0.2331],
    ] as [
        string,
        string,
        string,
        number,
        number,
        number,
        number,
        number,
        number,
    ][]
).map(
    ([title, address, tag, price, size, beds, baths, latitude, longitude]) => ({
        imageUrl: "",
        title,
        address,
        tag,
        price,
        size,
        beds,
        baths,
        latitude,
        longitude,
        link: "",
    })
)

function settle(p: Props) {
    return {
        homes: Array.isArray(p.homes) ? p.homes : HOMES,
        copy: { ...COPY, ...(p.copy || {}) },
        pricing: { ...PRICING, ...(p.pricing || {}) },
        terrain: { ...TERRAIN, ...(p.terrain || {}) },
        show: { ...SHOW, ...(p.show || {}) },
        markers: { ...MARKERS, ...(p.markers || {}) },
        listing: { ...LISTING, ...(p.listing || {}) },
        chrome: { ...CHROME, ...(p.chrome || {}) },
        glide: p.glide ?? 1.1,
        radius: p.radius ?? 20,
        titleFont: p.titleFont || {},
        uiFont: p.uiFont || {},
        labelFont: p.labelFont || {},
    }
}
type Settled = ReturnType<typeof settle>

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Mansard(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillMap {...props} />
    return <LiveMap {...props} />
}

// ───────────────────────── canvas / export: plain markup only ─────────────────────────
function StillMap(props: Props) {
    const s = settle(props)
    const sheet = useSheet()
    const states = sheet ? sheet.provinces : null
    const pins = useMemo(() => pinHomes(s.homes, states), [s.homes, states])
    const tally = useMemo(() => tallyStates(pins), [pins])
    const t = s.terrain
    const mk = s.markers
    const box = states ? spanOf(states) : [-500, -400, 500, 400]
    const padX = (box[2] - box[0]) * 0.05
    const padY = (box[3] - box[1]) * 0.07
    const vb = [
        box[0] - padX,
        box[1] - padY,
        box[2] - box[0] + padX * 2,
        box[3] - box[1] + padY * 2,
    ]
    const ui = { fontFamily: "Inter, sans-serif", ...s.uiFont }
    const r0 = (box[3] - box[1]) * 0.021

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: s.radius,
                background: t.ocean,
            }}
        >
            <svg
                viewBox={vb.join(" ")}
                preserveAspectRatio="xMidYMid meet"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                {sheet &&
                    s.show.shallows &&
                    SHALLOWS.slice()
                        .reverse()
                        .map((r) => (
                            <g key={r.w}>
                                <path
                                    d={sheet.shelfCoast}
                                    fill="none"
                                    stroke={t.shallows}
                                    strokeOpacity={r.o}
                                    strokeWidth={r.w}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    d={sheet.shelfCoast}
                                    fill="none"
                                    stroke={t.ocean}
                                    strokeWidth={r.w - 1.5}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </g>
                        ))}
                {sheet && (
                    <path
                        d={sheet.coast}
                        fill="none"
                        stroke={t.beach}
                        strokeWidth={8}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                )}
                {sheet && s.show.neighbours && sheet.neighbours && (
                    <path
                        d={sheet.neighbours}
                        fill={t.neighbour}
                        stroke={t.beach}
                        strokeWidth={0.6}
                        vectorEffect="non-scaling-stroke"
                    />
                )}
                {states &&
                    states.map((r) => (
                        <path
                            key={r.id}
                            d={r.d}
                            fill={tally.has(r.id) ? t.listed : t.land}
                            stroke={t.border}
                            strokeWidth={0.8}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                {sheet && sheet.lakes && (
                    <path
                        d={sheet.lakes}
                        fill={t.lake}
                        stroke={t.beach}
                        strokeWidth={0.6}
                        vectorEffect="non-scaling-stroke"
                    />
                )}
                {states &&
                    states.map((r) => {
                        const c = tally.get(r.id)
                        if (!c) return null
                        const rad =
                            r0 * (1 + Math.min(0.5, Math.sqrt(c.count) * 0.12))
                        return (
                            <g key={"c" + r.id}>
                                <circle
                                    cx={r.anchor[0]}
                                    cy={r.anchor[1]}
                                    r={rad * 1.25}
                                    fill={mk.countFill}
                                    opacity={0.2}
                                />
                                <circle
                                    cx={r.anchor[0]}
                                    cy={r.anchor[1]}
                                    r={rad}
                                    fill={mk.countFill}
                                />
                                <text
                                    x={r.anchor[0]}
                                    y={r.anchor[1]}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={mk.countInk}
                                    style={{
                                        ...ui,
                                        fontSize: rad * 0.95,
                                        fontWeight: 700,
                                    }}
                                >
                                    {c.count}
                                </text>
                            </g>
                        )
                    })}
            </svg>
            {s.chrome.chip && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        top: 16,
                        left: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        borderRadius: 999,
                        background: s.chrome.plate,
                        color: s.chrome.plateInk,
                        border: `1px solid ${mk.pinEdge}`,
                        fontSize: 13,
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 6,
                            background: mk.activeFill,
                        }}
                    />
                    {phrase(
                        s.copy.overview,
                        { count: pins.length, provinces: tally.size },
                        s.copy
                    )}
                </div>
            )}
            {s.chrome.north && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        top: 14,
                        right: 18,
                        color: s.chrome.plateInk,
                        fontSize: 10,
                        fontWeight: 600,
                        textAlign: "center",
                        lineHeight: 1,
                        opacity: 0.85,
                    }}
                >
                    N
                    <svg
                        width="10"
                        height="14"
                        viewBox="0 0 10 14"
                        style={{ display: "block", marginTop: 3 }}
                    >
                        <path
                            d="M5 0 L10 14 L5 10 L0 14 Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            )}
            {s.chrome.scale && s.copy.mapNote && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        left: 18,
                        bottom: 14,
                        color: s.chrome.plateInk,
                        opacity: 0.6,
                        fontSize: 11,
                    }}
                >
                    {s.copy.mapNote}
                </div>
            )}
            {s.chrome.zoom && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        right: 14,
                        top: 46,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        color: s.chrome.plateInk,
                    }}
                >
                    {["+", "−"].map((c) => (
                        <div
                            key={c}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 38,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                background: s.chrome.plate,
                                border: `1px solid ${mk.pinEdge}`,
                            }}
                        >
                            {c}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ───────────────────────── live ─────────────────────────
function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
    const [ok, setOk] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        let seen = false
        let tab =
            typeof document === "undefined" ||
            document.visibilityState !== "hidden"
        const sync = () => setOk(seen && tab)
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            seen = true
            sync()
        } else {
            io = new IntersectionObserver(
                (entries) => {
                    seen = entries.some((e) => e.isIntersecting)
                    sync()
                },
                { rootMargin: "80px" }
            )
            io.observe(el)
        }
        const onTab = () => {
            tab = document.visibilityState !== "hidden"
            sync()
        }
        document.addEventListener("visibilitychange", onTab)
        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onTab)
        }
    }, [])
    return ok
}

function useReducedMotion() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(mq.matches)
        sync()
        if (mq.addEventListener) mq.addEventListener("change", sync)
        else mq.addListener(sync)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", sync)
            else mq.removeListener(sync)
        }
    }, [])
    return calm
}

const useBeforePaint =
    typeof window !== "undefined" ? React.useLayoutEffect : useEffect

type View = { k: number; x: number; y: number }
type Trip = { a: View; b: View; t0: number; dur: number }
type Bundle = { key: string; mx: number; my: number; items: Pin[] }
type Focus = { kind: "home"; idx: number } | { kind: "group"; key: string }

const SCALE_STEPS = [
    0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000,
]

// placeholder art: a stone farmhouse with shutters above rows of lavender
function MasArt({ seed }: { seed: number }) {
    const h = hash3(seed, 17, 4)
    const skies = [
        ["#F7D9B5", "#F2B48C", "#FFF3DF"],
        ["#CFE3EE", "#9CC5DB", "#FFFFFF"],
        ["#F4C7C0", "#D99AA3", "#FFE9D6"],
        ["#E9E1F2", "#B7A8D6", "#FFF7E8"],
    ][Math.floor(h * 4)]
    const gid = "ms" + seed
    const shutter = ["#5D7FA3", "#6E9B87", "#8C6BA8", "#C2724F"][
        Math.floor(hash3(seed, 2, 4) * 4)
    ]
    const wall = ["#EBD9BB", "#E6CFAE", "#F0E2C8"][
        Math.floor(hash3(seed, 9, 4) * 3)
    ]
    const hx = 46 + hash3(seed, 3, 4) * 24
    const sx = 18 + hash3(seed, 5, 4) * 80
    return (
        <svg
            viewBox="0 0 120 90"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%", display: "block" }}
        >
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={skies[1]} />
                    <stop offset="1" stopColor={skies[0]} />
                </linearGradient>
            </defs>
            <rect width="120" height="90" fill={`url(#${gid})`} />
            <circle
                cx={sx}
                cy={20 + h * 8}
                r="7"
                fill={skies[2]}
                opacity="0.9"
            />
            <path
                d="M0 50 C24 40 44 46 64 42 C84 38 100 44 120 40 L120 90 L0 90 Z"
                fill="#B7B07E"
                opacity="0.55"
            />
            <path
                d="M0 56 C30 50 70 54 120 50 L120 90 L0 90 Z"
                fill="#A7A36E"
            />
            <rect x={hx - 18} y="40" width="36" height="20" fill={wall} />
            <path
                d={`M${hx - 21} 41 L${hx} 31 L${hx + 21} 41 Z`}
                fill="#C46A4A"
            />
            <rect
                x={hx - 13}
                y="45"
                width="6"
                height="7"
                fill="#3B3A36"
                opacity="0.7"
            />
            <rect x={hx - 15.5} y="45" width="2.5" height="7" fill={shutter} />
            <rect x={hx - 7} y="45" width="2.5" height="7" fill={shutter} />
            <rect
                x={hx + 6}
                y="45"
                width="6"
                height="7"
                fill="#3B3A36"
                opacity="0.7"
            />
            <rect x={hx + 3.5} y="45" width="2.5" height="7" fill={shutter} />
            <rect x={hx + 12} y="45" width="2.5" height="7" fill={shutter} />
            <rect x={hx - 3} y="51" width="6" height="9" fill={shutter} />
            {[hx - 30, hx + 28].map((x, i) => (
                <path
                    key={i}
                    d={`M${x} 60 C${x - 3} 50 ${x - 2} 38 ${x} 30 C${x + 2} 38 ${x + 3} 50 ${x} 60 Z`}
                    fill="#3F5A3A"
                />
            ))}
            {[0, 1, 2, 3, 4, 5].map((k) => (
                <path
                    key={k}
                    d={`M${-20 + k * 30} 90 Q${40 + k * 4} 66 ${60 + k * 2} 61`}
                    stroke="#8E78C2"
                    strokeWidth={5 - k * 0.55}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.95}
                />
            ))}
            <rect
                x="0"
                y="58"
                width="120"
                height="3"
                fill="#A7A36E"
                opacity="0.6"
            />
        </svg>
    )
}

function LiveMap(props: Props) {
    const s = settle(props)
    const live = useRef<Settled>(s)
    live.current = s
    const uid = "mn" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const planeRef = useRef<SVGGElement>(null)
    const tipRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const beakRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const barTextRef = useRef<HTMLSpanElement>(null)
    const tracked = useRef(new Map<string, HTMLDivElement>())

    const sheet = useSheet()
    const states = sheet ? sheet.provinces : null
    const onScreen = useOnScreen(rootRef)
    const calm = useReducedMotion()
    const onScreenRef = useRef(false)
    onScreenRef.current = onScreen
    const calmRef = useRef(false)
    calmRef.current = calm

    const [frame, setFrame] = useState({ w: 0, h: 0 })
    const frameRef = useRef(frame)
    const [openId, setOpenId] = useState<string | null>(null)
    const openRef = useRef<string | null>(null)
    openRef.current = openId
    const [depth, setDepth] = useState(1)
    const [hoverId, setHoverId] = useState<string | null>(null)
    const [peek, setPeek] = useState<Focus | null>(null)
    const [picked, setPicked] = useState<number | null>(null)
    const [hearts, setHearts] = useState<Record<number, boolean>>({})
    const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([])

    const book = useBoundary(
        REGION_SOURCES,
        readRegions,
        !!openId && s.show.regions
    )

    const view = useRef<View>({ k: 1, x: 0, y: 0 })
    const trip = useRef<Trip | null>(null)
    const raf = useRef(0)
    const drag = useRef<{
        x: number
        y: number
        vx: number
        vy: number
        moved: boolean
    } | null>(null)
    const draggedRef = useRef(false)
    const touchRef = useRef(false)
    const closeTimer = useRef<any>(0)
    const wheelTimer = useRef<any>(0)

    const pins = useMemo(() => pinHomes(s.homes, states), [s.homes, states])
    const tally = useMemo(() => tallyStates(pins), [pins])
    const byId = useMemo(() => {
        const m = new Map<string, Area>()
        if (states) states.forEach((r) => m.set(r.id, r))
        return m
    }, [states])
    const whole = useMemo(
        () => (states ? spanOf(states) : [-500, -400, 500, 400]),
        [states]
    )
    const wholeRef = useRef(whole)
    wholeRef.current = whole

    const towns: Town[] = useMemo(() => {
        if (!states) return []
        return TOWNS.map(([name, lat, lng, rank]) => {
            const [x, y] = toMap(lng, lat)
            return {
                name,
                x,
                y,
                rank,
                state: whichArea(x, y, states),
                land: landOf(lat, lng),
            }
        })
    }, [states])

    const trunk = useMemo(() => {
        let out = ""
        for (const land of ["main", "corse"])
            out += highways(
                towns
                    .filter((t) => t.land === land && t.rank <= 2)
                    .map((t) => ({ x: t.x, y: t.y, big: true }))
            ).major
        return out
    }, [towns])

    const fitBox = useCallback((b: number[], share: number): View => {
        const { w, h } = frameRef.current
        const k =
            Math.min(
                w / Math.max(1, b[2] - b[0]),
                h / Math.max(1, b[3] - b[1])
            ) * share
        const cx = (b[0] + b[2]) / 2
        const cy = (b[1] + b[3]) / 2
        return { k, x: w / 2 - cx * k, y: h / 2 - cy * k }
    }, [])
    const overview = useCallback(() => fitBox(wholeRef.current, 0.9), [fitBox])
    const fitOf = useCallback(
        (id: string | null) => {
            const r = id ? byId.get(id) : null
            return r ? fitBox(r.box, 0.72) : overview()
        },
        [byId, fitBox, overview]
    )

    const clampView = useCallback((c: View): View => {
        const { w, h } = frameRef.current
        const b = wholeRef.current
        const cx = Math.max(b[0], Math.min(b[2], (w / 2 - c.x) / c.k))
        const cy = Math.max(b[1], Math.min(b[3], (h / 2 - c.y) / c.k))
        return { k: c.k, x: w / 2 - cx * c.k, y: h / 2 - cy * c.k }
    }, [])

    // camera → DOM directly; React re-renders only when zoom depth settles
    const paint = useCallback(() => {
        const c = view.current
        if (planeRef.current)
            planeRef.current.setAttribute(
                "transform",
                `matrix(${c.k} 0 0 ${c.k} ${c.x} ${c.y})`
            )
        tracked.current.forEach((el) => {
            const x = Number(el.dataset.mx) * c.k + c.x
            const y = Number(el.dataset.my) * c.k + c.y
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        })
        const { w, h } = frameRef.current
        const cd = cardRef.current
        if (cd && cd.dataset.mx) {
            const sx = Number(cd.dataset.mx) * c.k + c.x
            const sy = Number(cd.dataset.my) * c.k + c.y
            const lift = Number(cd.dataset.lift || 0)
            const cw = cd.offsetWidth
            const ch = cd.offsetHeight
            const safe = live.current.chrome.chip ? 64 : 12
            let top = sy - lift - 16 - ch
            let above = true
            if (top < safe) {
                above = false
                top = Math.max(safe, Math.min(h - ch - 12, sy + 18))
            }
            const left = Math.max(12, Math.min(w - cw - 12, sx - cw / 2))
            cd.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`
            const beak = beakRef.current
            if (beak) {
                beak.style.left =
                    Math.max(22, Math.min(cw - 22, sx - left)).toFixed(1) + "px"
                beak.style.top = above ? "100%" : "0%"
            }
        }
        const bar = barRef.current
        const txt = barTextRef.current
        if (bar && txt) {
            const mi = live.current.chrome.units === "mi"
            const pxPer = (c.k / KM_PER_UNIT) * (mi ? 1.609344 : 1)
            let pick = SCALE_STEPS[0]
            for (const v of SCALE_STEPS) if (v * pxPer <= 96) pick = v
            bar.style.width = Math.max(8, pick * pxPer).toFixed(1) + "px"
            txt.textContent = `${pick} ${mi ? "mi" : "km"}`
        }
    }, [])

    const frameStep = useCallback(
        (now: number) => {
            raf.current = 0
            if (!onScreenRef.current) return
            const tr = trip.current
            if (!tr) return
            const t = Math.min(1, (now - tr.t0) / tr.dur)
            const e =
                t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
            const { w, h } = frameRef.current
            const ax = (w / 2 - tr.a.x) / tr.a.k
            const ay = (h / 2 - tr.a.y) / tr.a.k
            const bx = (w / 2 - tr.b.x) / tr.b.k
            const by = (h / 2 - tr.b.y) / tr.b.k
            const k = tr.a.k * Math.pow(tr.b.k / tr.a.k, e)
            const cx = ax + (bx - ax) * e
            const cy = ay + (by - ay) * e
            view.current = { k, x: w / 2 - cx * k, y: h / 2 - cy * k }
            paint()
            if (t >= 1) {
                view.current = tr.b
                trip.current = null
                paint()
                return
            }
            raf.current = requestAnimationFrame(frameStep)
        },
        [paint]
    )

    const wake = useCallback(() => {
        if (raf.current || !onScreenRef.current || !trip.current) return
        raf.current = requestAnimationFrame(frameStep)
    }, [frameStep])

    const travel = useCallback(
        (b: View, ms?: number) => {
            const dur = calmRef.current ? 0 : (ms ?? live.current.glide * 1000)
            if (dur <= 0 || !onScreenRef.current) {
                trip.current = null
                view.current = b
                paint()
                return
            }
            trip.current = {
                a: { ...view.current },
                b,
                t0: performance.now(),
                dur,
            }
            wake()
        },
        [paint, wake]
    )

    useEffect(() => {
        if (onScreen) {
            if (trip.current) trip.current.t0 = performance.now()
            wake()
        } else {
            if (raf.current) cancelAnimationFrame(raf.current)
            raf.current = 0
            drag.current = null
        }
    }, [onScreen, wake])

    useEffect(
        () => () => {
            if (raf.current) cancelAnimationFrame(raf.current)
            clearTimeout(closeTimer.current)
            clearTimeout(wheelTimer.current)
        },
        []
    )

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            if (
                r.width !== frameRef.current.w ||
                r.height !== frameRef.current.h
            ) {
                frameRef.current = { w: r.width, h: r.height }
                setFrame(frameRef.current)
            }
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useBeforePaint(() => {
        if (!states || !frame.w || !frame.h) return
        trip.current = null
        const target = fitOf(openId)
        view.current = target
        setDepth(target.k)
        paint()
    }, [states, frame.w, frame.h])

    const enter = useCallback(
        (id: string) => {
            if (!byId.get(id)) return
            setPeek(null)
            setPicked(null)
            setHoverId(null)
            setOpenId(id)
            const target = fitOf(id)
            setDepth(target.k)
            travel(target)
        },
        [byId, fitOf, travel]
    )

    const leave = useCallback(() => {
        setPeek(null)
        setPicked(null)
        setOpenId(null)
        const target = overview()
        setDepth(target.k)
        travel(target)
    }, [overview, travel])

    const nudge = useCallback(
        (f: number) => {
            const { w, h } = frameRef.current
            const c = trip.current ? trip.current.b : view.current
            const base = overview().k
            const k = Math.max(base * 0.85, Math.min(base * DEEPEST, c.k * f))
            if (openId && f < 1 && k < fitOf(openId).k * 0.7) {
                leave()
                return
            }
            const cx = (w / 2 - c.x) / c.k
            const cy = (h / 2 - c.y) / c.k
            setPeek(null)
            setDepth(k)
            travel(clampView({ k, x: w / 2 - cx * k, y: h / 2 - cy * k }), 460)
        },
        [overview, openId, fitOf, leave, travel, clampView]
    )

    // pinch / wheel zoom anchored to the pointer
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            const mode = live.current.chrome.wheel
            if (mode === "off" || (mode === "pinch" && !e.ctrlKey)) return
            e.preventDefault()
            const r = el.getBoundingClientRect()
            const px = e.clientX - r.left
            const py = e.clientY - r.top
            const c = view.current
            const base = overview().k
            const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022))
            const k = Math.max(base * 0.8, Math.min(base * DEEPEST, c.k * f))
            const q = k / c.k
            trip.current = null
            view.current = clampView({
                k,
                x: px - (px - c.x) * q,
                y: py - (py - c.y) * q,
            })
            paint()
            clearTimeout(wheelTimer.current)
            wheelTimer.current = setTimeout(() => {
                const id = openRef.current
                if (id && view.current.k < fitOf(id).k * 0.55) leave()
                else setDepth(view.current.k)
            }, 140)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [overview, clampView, paint, fitOf, leave])

    const focus = openId ? byId.get(openId) || null : null
    const fitK = useMemo(
        () => fitOf(openId).k,
        [openId, frame.w, frame.h, fitOf]
    )
    const ratio = depth / fitK

    const local = useMemo(
        () => (openId ? pins.filter((q) => q.state === openId) : []),
        [openId, pins]
    )

    const bundles: Bundle[] = useMemo(() => {
        if (!openId) return []
        const gap = s.markers.gather
        const out: Bundle[] = []
        const pool = local
            .slice()
            .sort(
                (a, b) =>
                    (Number(b.home.price) || 0) - (Number(a.home.price) || 0)
            )
        for (const q of pool) {
            const hit = out.find(
                (c) =>
                    Math.abs((c.mx - q.mx) * depth) < gap &&
                    Math.abs((c.my - q.my) * depth) < gap * 0.6
            )
            if (hit) {
                hit.items.push(q)
                const n = hit.items.length
                hit.mx += (q.mx - hit.mx) / n
                hit.my += (q.my - hit.my) / n
            } else out.push({ key: "", mx: q.mx, my: q.my, items: [q] })
        }
        out.forEach((c) => {
            c.key = c.items
                .map((q) => q.i)
                .sort((a, b) => a - b)
                .join("-")
        })
        return out
    }, [openId, local, depth, s.markers.gather])

    useEffect(() => {
        setPeek((p) => (p && p.kind === "group" ? null : p))
    }, [depth])

    const level = Math.max(
        0,
        Math.min(7, Math.round(Math.log2((BLOCK * depth) / BLOCK_ON_SCREEN)))
    )
    const turn = openId ? hash3(seedOf(openId), 5, 1) * (Math.PI / 2) : 0
    const spotsKey = local
        .map((q) => q.mx.toFixed(2) + "," + q.my.toFixed(2))
        .join("|")
    const grid = useMemo(
        () =>
            focus && s.show.streets && local.length
                ? suburb(
                      local.map((q) => [q.mx, q.my]),
                      level,
                      turn
                  )
                : null,
        [openId, level, spotsKey, s.show.streets]
    )

    const localRoads = useMemo(() => {
        if (!focus || !s.show.roads) return null
        const b = focus.box
        const mx = (b[2] - b[0]) * 0.15
        const my = (b[3] - b[1]) * 0.15
        const nodes: Stop[] = towns
            .filter(
                (t) =>
                    t.state === openId ||
                    (t.rank <= 2 &&
                        t.x > b[0] - mx &&
                        t.x < b[2] + mx &&
                        t.y > b[1] - my &&
                        t.y < b[3] + my)
            )
            .map((t) => ({ x: t.x, y: t.y, big: true }))
        local.forEach((q) => nodes.push({ x: q.mx, y: q.my, big: false }))
        return highways(nodes)
    }, [openId, towns, spotsKey, s.show.roads])

    const regionSet = useMemo(
        () =>
            s.show.regions
                ? regionsOf(book, sheet, openId)
                : { areas: [] as Area[], borders: "" },
        [book, sheet, openId, s.show.regions]
    )
    const regions = regionSet.areas.length > 1 ? regionSet.areas : []
    const regionD = regionSet.borders

    const captions = useMemo(() => {
        if (!focus) return [] as Caption[]
        const list: Caption[] = []
        if (s.show.towns) {
            const cap = ratio >= 1.4 ? 3 : 2
            towns
                .filter((t) => t.state === openId && t.rank <= cap)
                .sort((a, b) => a.rank - b.rank)
                .forEach((t, n) =>
                    list.push({
                        key: "t" + n + t.name,
                        x: t.x,
                        y: t.y,
                        text: t.name,
                        kind: "town",
                        rank: t.rank,
                    })
                )
        }
        if (s.chrome.names && states)
            states
                .filter((r) => r.id !== openId && !tally.has(r.id))
                .forEach((r) =>
                    list.push({
                        key: "s" + r.id,
                        x: r.anchor[0],
                        y: r.anchor[1],
                        text: r.name,
                        kind: "state",
                        rank: 4,
                    })
                )
        if (ratio >= 1.2)
            regions
                .slice()
                .sort((a, b) => b.area - a.area)
                .forEach((c) =>
                    list.push({
                        key: "c" + c.id,
                        x: c.anchor[0],
                        y: c.anchor[1],
                        text: c.name,
                        kind: "region",
                        rank: 5,
                    })
                )
        const blocks: number[][] = []
        bundles.forEach((b) =>
            blocks.push([
                b.mx * depth - 52,
                b.my * depth - 56,
                b.mx * depth + 52,
                b.my * depth + 8,
            ])
        )
        if (states)
            states.forEach((r) => {
                if (r.id === openId || !tally.has(r.id)) return
                blocks.push([
                    r.anchor[0] * depth - 22,
                    r.anchor[1] * depth - 22,
                    r.anchor[0] * depth + 22,
                    r.anchor[1] * depth + 22,
                ])
            })
        return spaceOut(list, depth, blocks)
    }, [
        openId,
        towns,
        regions,
        depth,
        ratio,
        bundles,
        states,
        tally,
        s.show.towns,
        s.chrome.names,
    ])

    const pickHome = useCallback(
        (idx: number, split: boolean) => {
            const q = pins.find((p) => p.i === idx)
            if (!q) return
            const base = overview().k
            let k = trip.current ? trip.current.b.k : view.current.k
            if (split) {
                let dmin = Infinity
                for (const o of pins) {
                    if (o.i === idx || o.state !== q.state) continue
                    dmin = Math.min(
                        dmin,
                        Math.max(
                            Math.abs(o.mx - q.mx),
                            Math.abs(o.my - q.my) / 0.6
                        )
                    )
                }
                if (isFinite(dmin) && dmin > 0)
                    k = Math.max(k, (live.current.markers.gather * 1.2) / dmin)
                k = Math.min(k, base * DEEPEST)
            }
            const { w, h } = frameRef.current
            const ch = (cardRef.current && cardRef.current.offsetHeight) || 300
            const cy = q.my - (ch / 2 + 36) / k
            setPeek(null)
            setPicked(idx)
            setDepth(k)
            travel(
                clampView({ k, x: w / 2 - q.mx * k, y: h / 2 - cy * k }),
                700
            )
        },
        [pins, overview, travel, clampView]
    )

    const openBundle = useCallback(
        (b: Bundle) => {
            const box = [Infinity, Infinity, -Infinity, -Infinity]
            b.items.forEach((q) => {
                box[0] = Math.min(box[0], q.mx)
                box[1] = Math.min(box[1], q.my)
                box[2] = Math.max(box[2], q.mx)
                box[3] = Math.max(box[3], q.my)
            })
            const base = overview().k
            const fit = fitBox(box, 0.45).k
            const want = Math.min(
                base * DEEPEST,
                Math.max(depth * 2, Math.min(fit, depth * 6))
            )
            const { w, h } = frameRef.current
            const cx = (box[0] + box[2]) / 2
            const cy = (box[1] + box[3]) / 2
            setPeek(null)
            setDepth(want)
            travel(
                clampView({
                    k: want,
                    x: w / 2 - cx * want,
                    y: h / 2 - cy * want,
                }),
                700
            )
        },
        [overview, fitBox, depth, travel, clampView]
    )

    const go = useCallback((href?: string) => {
        if (!href || typeof window === "undefined") return
        if (live.current.listing.newTab)
            window.open(href, "_blank", "noopener,noreferrer")
        else window.location.href = href
    }, [])

    const hold = () => clearTimeout(closeTimer.current)
    const letGo = () => {
        clearTimeout(closeTimer.current)
        closeTimer.current = setTimeout(() => setPeek(null), 200)
    }
    const clearAll = () => {
        setPeek(null)
        setPicked(null)
    }

    useBeforePaint(() => {
        paint()
    })

    const tapAt = (e: React.MouseEvent) => {
        const root = rootRef.current
        if (!root || calmRef.current) return
        const r = root.getBoundingClientRect()
        const id = Date.now() + Math.random()
        setTaps((list) =>
            list.concat({ id, x: e.clientX - r.left, y: e.clientY - r.top })
        )
    }

    const onDown = (e: React.PointerEvent) => {
        touchRef.current = e.pointerType === "touch"
        if (e.button !== 0 && e.pointerType === "mouse") return
        draggedRef.current = false
        drag.current = {
            x: e.clientX,
            y: e.clientY,
            vx: view.current.x,
            vy: view.current.y,
            moved: false,
        }
        const move = (ev: PointerEvent) => {
            const d = drag.current
            if (!d) return
            const dx = ev.clientX - d.x
            const dy = ev.clientY - d.y
            if (!d.moved && Math.hypot(dx, dy) > 4) {
                d.moved = true
                draggedRef.current = true
                trip.current = null
                if (tipRef.current) tipRef.current.style.opacity = "0"
                if (rootRef.current) rootRef.current.style.cursor = "grabbing"
            }
            if (d.moved) {
                view.current = clampView({
                    k: view.current.k,
                    x: d.vx + dx,
                    y: d.vy + dy,
                })
                paint()
            }
        }
        const up = () => {
            drag.current = null
            if (rootRef.current) rootRef.current.style.cursor = "grab"
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
    }

    const onHover = (e: React.PointerEvent) => {
        const tip = tipRef.current
        const root = rootRef.current
        if (!tip || !root || drag.current) return
        const r = root.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        const tw = tip.offsetWidth
        const th = tip.offsetHeight
        const fx = x + 16 + tw > r.width - 8 ? x - 16 - tw : x + 16
        const fy = y + 16 + th > r.height - 8 ? y - 16 - th : y + 16
        tip.style.transform = `translate3d(${fx}px, ${fy}px, 0)`
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key !== "Escape") return
        if (picked !== null || peek) clearAll()
        else if (openId) leave()
    }

    // ───── derived view ─────
    const t = s.terrain
    const mk = s.markers
    const ls = s.listing
    const ui = { fontFamily: "Inter, sans-serif", ...s.uiFont }
    const label = {
        fontFamily: "ui-monospace, Menlo, monospace",
        letterSpacing: "0.11em",
        ...s.labelFont,
    }
    const heading = {
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        ...s.titleFont,
    }
    const price = (v: number) => cash(v, s.pricing.currency, s.pricing.compact)

    const hoverArea = hoverId ? byId.get(hoverId) : null
    const hoverTally = hoverId ? tally.get(hoverId) : undefined
    const tipShown = !!(hoverArea && hoverTally && hoverId !== openId)
    const hoverHomes = hoverId ? pins.filter((q) => q.state === hoverId) : []

    const shown: Focus | null =
        peek || (picked !== null ? { kind: "home", idx: picked } : null)
    const shownBundle =
        shown && shown.kind === "group"
            ? bundles.find((b) => b.key === shown.key) || null
            : null
    const shownHome =
        shown && shown.kind === "home"
            ? pins.find((q) => q.i === shown.idx) || null
            : null
    const anchor = shownHome
        ? [shownHome.mx, shownHome.my]
        : shownBundle
          ? [shownBundle.mx, shownBundle.my]
          : null
    const isPickedView = !!(shownHome && picked === shownHome.i && !peek)
    const narrow = frame.w > 0 && frame.w < 520
    const compact = ls.layout === "ticket" || narrow
    const cardW = shownBundle
        ? Math.min(300, frame.w - 24)
        : Math.min(compact ? 360 : ls.width, Math.max(240, frame.w - 24))
    const maxCount = Math.max(
        1,
        ...Array.from(tally.values()).map((c) => c.count)
    )
    const pulseOn = onScreen && !calm

    const bind = (key: string) => (el: HTMLDivElement | null) => {
        if (el) tracked.current.set(key, el)
        else tracked.current.delete(key)
    }

    const ids = { clip: uid + "c", mask: uid + "m", grad: uid + "g" }

    return (
        <div
            ref={rootRef}
            tabIndex={0}
            onKeyDown={onKey}
            onPointerDown={onDown}
            onPointerMove={onHover}
            onScroll={(e) => {
                const el = e.currentTarget
                if (el.scrollTop || el.scrollLeft) {
                    el.scrollTop = 0
                    el.scrollLeft = 0
                }
            }}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: s.radius,
                background: t.ocean,
                cursor: "grab",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: openId ? "none" : "pan-y",
            }}
        >
            <style>{`
@keyframes ${uid}pulse { 0% { transform: translate(-50%,-50%) scale(1); opacity: .6 } 100% { transform: translate(-50%,-50%) scale(3.3); opacity: 0 } }
.${uid}pulse { animation: ${uid}pulse 1.6s cubic-bezier(.2,.7,.3,1) infinite }
.${uid}row:hover { background: ${ls.line} }
`}</style>
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, display: "block" }}
                role="img"
                aria-label="Map of homes by region"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !draggedRef.current)
                        clearAll()
                }}
            >
                <defs>
                    <radialGradient id={ids.grad}>
                        <stop offset="0" stopColor="#fff" stopOpacity="1" />
                        <stop
                            offset="0.55"
                            stopColor="#fff"
                            stopOpacity="0.92"
                        />
                        <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                    {focus && (
                        <clipPath id={ids.clip}>
                            <path d={focus.d} />
                        </clipPath>
                    )}
                    {grid && focus && (
                        <mask
                            id={ids.mask}
                            maskUnits="userSpaceOnUse"
                            x={focus.box[0] - grid.reach}
                            y={focus.box[1] - grid.reach}
                            width={focus.box[2] - focus.box[0] + grid.reach * 2}
                            height={
                                focus.box[3] - focus.box[1] + grid.reach * 2
                            }
                        >
                            {local.map((q) => (
                                <circle
                                    key={q.i}
                                    cx={q.mx}
                                    cy={q.my}
                                    r={grid.reach}
                                    fill={`url(#${ids.grad})`}
                                />
                            ))}
                        </mask>
                    )}
                </defs>
                <g ref={planeRef}>
                    {sheet &&
                        s.show.shallows &&
                        SHALLOWS.slice()
                            .reverse()
                            .map((r) => (
                                <g key={r.w} style={{ pointerEvents: "none" }}>
                                    <path
                                        d={sheet.shelfCoast}
                                        fill="none"
                                        stroke={t.shallows}
                                        strokeOpacity={r.o}
                                        strokeWidth={r.w}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <path
                                        d={sheet.shelfCoast}
                                        fill="none"
                                        stroke={t.ocean}
                                        strokeWidth={r.w - 1.5}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </g>
                            ))}
                    {sheet && (
                        <path
                            d={sheet.coast}
                            fill="none"
                            stroke={t.beach}
                            strokeWidth={10}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            style={{ pointerEvents: "none" }}
                        />
                    )}
                    {sheet && s.show.neighbours && sheet.neighbours && (
                        <path
                            d={sheet.neighbours}
                            fill={t.neighbour}
                            stroke={t.beach}
                            strokeWidth={0.6}
                            vectorEffect="non-scaling-stroke"
                            style={{ pointerEvents: "none" }}
                        />
                    )}
                    {states && (
                        <path
                            d={states.map((r) => r.d).join("")}
                            fill={t.neighbour}
                            style={{ pointerEvents: "none" }}
                        />
                    )}
                    {states &&
                        states.map((r) => {
                            const has = tally.has(r.id)
                            const dim = !!openId && r.id !== openId
                            return (
                                <path
                                    key={r.id}
                                    d={r.d}
                                    fill={has ? t.listed : t.land}
                                    stroke={t.border}
                                    strokeWidth={0.8}
                                    vectorEffect="non-scaling-stroke"
                                    onPointerEnter={() => setHoverId(r.id)}
                                    onPointerLeave={() =>
                                        setHoverId((h) =>
                                            h === r.id ? null : h
                                        )
                                    }
                                    onClick={(e) => {
                                        if (draggedRef.current) return
                                        if (has && r.id !== openId) {
                                            tapAt(e)
                                            enter(r.id)
                                        } else clearAll()
                                    }}
                                    style={{
                                        opacity: dim ? t.fade : 1,
                                        cursor:
                                            has && r.id !== openId
                                                ? "pointer"
                                                : "inherit",
                                        transition: "opacity 0.5s ease",
                                    }}
                                />
                            )
                        })}
                    {trunk && s.show.roads && (
                        <path
                            d={trunk}
                            fill="none"
                            stroke={t.highway}
                            strokeOpacity={openId ? 0.26 : 0.4}
                            strokeWidth={0.9}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            style={{
                                pointerEvents: "none",
                                transition: "stroke-opacity 0.5s ease",
                            }}
                        />
                    )}
                    {focus && (
                        <g>
                            <path
                                d={focus.d}
                                fill="#000"
                                opacity={0.35}
                                transform={`translate(0 ${5 / depth})`}
                                style={{ pointerEvents: "none" }}
                            />
                            <path
                                d={focus.d}
                                fill={t.focus}
                                stroke={t.border}
                                strokeWidth={1.4}
                                vectorEffect="non-scaling-stroke"
                                onClick={() => {
                                    if (!draggedRef.current) clearAll()
                                }}
                            />
                        </g>
                    )}
                    {focus && regionD && (
                        <g
                            clipPath={`url(#${ids.clip})`}
                            style={{ pointerEvents: "none" }}
                        >
                            <path
                                d={regionD}
                                fill="none"
                                stroke={t.region}
                                strokeWidth={1}
                                strokeDasharray="5 4"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}
                    <AnimatePresence>
                        {grid && focus && (
                            <motion.g
                                key={"lv" + level + openId}
                                clipPath={`url(#${ids.clip})`}
                                mask={`url(#${ids.mask})`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: calm ? 0 : 0.45 }}
                                style={{ pointerEvents: "none" }}
                            >
                                <path
                                    d={grid.minor}
                                    fill="none"
                                    stroke={t.street}
                                    strokeWidth={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    d={grid.reserves}
                                    fill={t.reserve}
                                    stroke={t.avenue}
                                    strokeWidth={0.6}
                                    strokeOpacity={0.5}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    d={grid.dams}
                                    fill={t.lake}
                                    stroke={t.beach}
                                    strokeWidth={0.8}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    d={grid.major}
                                    fill="none"
                                    stroke={t.avenue}
                                    strokeWidth={1.8}
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </motion.g>
                        )}
                    </AnimatePresence>
                    {localRoads && focus && (
                        <g
                            clipPath={`url(#${ids.clip})`}
                            style={{ pointerEvents: "none" }}
                        >
                            <path
                                d={localRoads.minor}
                                fill="none"
                                stroke={t.highway}
                                strokeOpacity={0.65}
                                strokeWidth={1.3}
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d={localRoads.major}
                                fill="none"
                                stroke={t.highway}
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}
                    {hoverArea && hoverTally && hoverId !== openId && (
                        <g style={{ pointerEvents: "none" }}>
                            <path
                                d={hoverArea.d}
                                fill="#000"
                                opacity={0.38}
                                transform={`translate(0 ${3 / depth})`}
                            />
                            <path
                                d={hoverArea.d}
                                fill={t.hover}
                                stroke={mk.countFill}
                                strokeOpacity={0.55}
                                strokeWidth={1.4}
                                vectorEffect="non-scaling-stroke"
                                transform={`translate(0 ${-3 / depth})`}
                            />
                        </g>
                    )}
                    {sheet && sheet.lakes && (
                        <path
                            d={sheet.lakes}
                            fill={t.lake}
                            stroke={t.beach}
                            strokeWidth={0.7}
                            vectorEffect="non-scaling-stroke"
                            style={{ pointerEvents: "none" }}
                        />
                    )}
                </g>
            </svg>

            {/* warm dusk vignette */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                        "radial-gradient(120% 95% at 50% 42%, transparent 55%, rgba(8,12,14,0.42) 100%)",
                }}
            />

            {/* city dots at country scale */}
            {!openId &&
                s.show.towns &&
                towns
                    .filter((c) => c.rank === 1)
                    .map((c, n) => (
                        <div
                            key={"o" + n}
                            ref={bind("o" + n)}
                            data-mx={c.x}
                            data-my={c.y}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 4,
                                    transform: "translate(-50%,-50%)",
                                    background: s.chrome.plateInk,
                                    opacity: 0.4,
                                }}
                            />
                        </div>
                    ))}

            {/* labels */}
            {captions.map((l) => (
                <div
                    key={l.key}
                    ref={bind("l" + l.key)}
                    data-mx={l.x}
                    data-my={l.y}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        pointerEvents: "none",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity:
                                l.kind === "town"
                                    ? 0.85
                                    : l.kind === "region"
                                      ? 0.4
                                      : 0.32,
                        }}
                        transition={{
                            duration: calm ? 0 : 0.4,
                            delay: calm ? 0 : 0.3,
                        }}
                        style={{
                            ...label,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                            transform:
                                l.kind === "town"
                                    ? "translate(-4px, -50%)"
                                    : "translate(-50%, -50%)",
                            fontSize:
                                l.kind === "town"
                                    ? l.rank === 1
                                        ? 11
                                        : 10
                                    : 9.5,
                            fontWeight:
                                l.kind === "town" && l.rank === 1 ? 600 : 500,
                            textTransform: "uppercase",
                            color: s.chrome.plateInk,
                            textShadow: `0 1px 2px ${t.land}`,
                        }}
                    >
                        {l.kind === "town" && (
                            <span
                                style={{
                                    width: l.rank === 1 ? 6 : 4,
                                    height: l.rank === 1 ? 6 : 4,
                                    borderRadius: 6,
                                    background: s.chrome.plateInk,
                                    boxShadow: `0 0 0 2px ${t.focus}`,
                                    flex: "none",
                                }}
                            />
                        )}
                        {l.text}
                    </motion.div>
                </div>
            ))}

            {/* state count badges */}
            {states &&
                states.map((r) => {
                    const c = tally.get(r.id)
                    if (!c || r.id === openId) return null
                    const d = 28 + Math.sqrt(c.count / maxCount) * 14
                    const quiet = !!openId
                    const lit = hoverId === r.id
                    return (
                        <div
                            key={"b" + r.id}
                            ref={bind("b" + r.id)}
                            data-mx={r.anchor[0]}
                            data-my={r.anchor[1]}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                zIndex: lit ? 6 : 5,
                            }}
                        >
                            <div
                                style={{
                                    transform: "translate(-50%, -50%)",
                                    position: "relative",
                                }}
                            >
                                {lit && pulseOn && (
                                    <span
                                        className={uid + "pulse"}
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                            width: d,
                                            height: d,
                                            borderRadius: d,
                                            border: `1.5px solid ${mk.countFill}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                                <motion.button
                                    type="button"
                                    aria-label={`${r.name}: ${phrase("{count} {unit}", { count: c.count }, s.copy)}`}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: quiet ? 0.78 : lit ? 1.14 : 1,
                                        opacity: quiet && !lit ? 0.7 : 1,
                                    }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 24,
                                    }}
                                    onPointerEnter={() => setHoverId(r.id)}
                                    onPointerLeave={() =>
                                        setHoverId((h) =>
                                            h === r.id ? null : h
                                        )
                                    }
                                    onClick={(e) => {
                                        if (draggedRef.current) return
                                        tapAt(e)
                                        enter(r.id)
                                    }}
                                    style={{
                                        ...ui,
                                        width: d,
                                        height: d,
                                        borderRadius: d,
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer",
                                        background: mk.countFill,
                                        color: mk.countInk,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        boxShadow: `0 0 0 ${lit ? 6 : 4}px ${mk.countFill}33, 0 6px 14px rgba(31,43,77,0.28)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "box-shadow 0.25s ease",
                                    }}
                                >
                                    {c.count}
                                </motion.button>
                            </div>
                        </div>
                    )
                })}

            {/* price pins */}
            {bundles.map((b) => {
                const single = b.items.length === 1
                const q = b.items[0]
                const holds = shown
                    ? shown.kind === "home"
                        ? b.items.some((x) => x.i === shown.idx)
                        : shown.key === b.key
                    : false
                const isPicked =
                    picked !== null && b.items.some((x) => x.i === picked)
                const active = holds || isPicked
                const quiet = !!shown && !holds
                const loved = single && hearts[q.i]
                const box = focus ? focus.box : [0, 0, 1, 1]
                const wave = (b.mx - box[0]) / Math.max(1, box[2] - box[0])
                const lo = Math.min(
                    ...b.items.map((x) => Number(x.home.price) || 0)
                )
                const text = single
                    ? price(Number(q.home.price) || 0)
                    : phrase(
                          s.copy.groupTitle.replace(/\s*here$/i, ""),
                          { count: b.items.length },
                          s.copy
                      )
                const faces = b.items.slice(0, 3)
                return (
                    <div
                        key={"p" + b.key}
                        ref={bind("p" + b.key)}
                        data-mx={b.mx}
                        data-my={b.my}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            zIndex: active ? 22 : 10,
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: 9,
                                height: 9,
                                borderRadius: 9,
                                transform: "translate(-50%,-50%)",
                                background: active ? mk.activeFill : mk.pinInk,
                                boxShadow: `0 0 0 2.5px ${mk.pinFill}`,
                                pointerEvents: "none",
                            }}
                        />
                        {active && pulseOn && (
                            <span
                                className={uid + "pulse"}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 12,
                                    background: mk.activeFill,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                bottom: 10,
                                transform: "translateX(-50%)",
                            }}
                        >
                            <motion.button
                                type="button"
                                aria-label={
                                    single
                                        ? `${q.home.title || "Home"}, ${text}`
                                        : text
                                }
                                initial={{ scale: 0.5, opacity: 0, y: -16 }}
                                animate={{
                                    scale: active ? 1.06 : 1,
                                    opacity: quiet ? 0.5 : 1,
                                    y: active ? -3 : 0,
                                }}
                                whileHover={{ y: -4, scale: 1.06 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    default: {
                                        delay: calm ? 0 : 0.3 + wave * 0.45,
                                        type: "spring",
                                        stiffness: 460,
                                        damping: 26,
                                    },
                                }}
                                onPointerEnter={(e) => {
                                    if (e.pointerType === "touch") return
                                    hold()
                                    setPeek(
                                        single
                                            ? { kind: "home", idx: q.i }
                                            : { kind: "group", key: b.key }
                                    )
                                }}
                                onPointerLeave={(e) => {
                                    if (e.pointerType !== "touch") letGo()
                                }}
                                onFocus={() =>
                                    setPeek(
                                        single
                                            ? { kind: "home", idx: q.i }
                                            : { kind: "group", key: b.key }
                                    )
                                }
                                onBlur={() => letGo()}
                                onClick={() => {
                                    if (draggedRef.current) return
                                    if (!single) return openBundle(b)
                                    if (
                                        picked === q.i &&
                                        !touchRef.current &&
                                        q.home.link
                                    )
                                        return go(q.home.link)
                                    pickHome(q.i, false)
                                }}
                                style={{
                                    ...ui,
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                    height: 34,
                                    padding: single ? "0 14px" : "0 12px 0 6px",
                                    borderRadius: "17px 17px 17px 6px",
                                    border: `1px solid ${active ? mk.activeFill : mk.pinEdge}`,
                                    background: active
                                        ? mk.activeFill
                                        : mk.pinFill,
                                    color: active ? mk.activeInk : mk.pinInk,
                                    fontSize: 13,
                                    fontWeight: 650,
                                    whiteSpace: "nowrap",
                                    cursor: "pointer",
                                    boxShadow: active
                                        ? "0 12px 24px rgba(31,43,77,0.32)"
                                        : "0 6px 14px rgba(31,43,77,0.22)",
                                    transition:
                                        "background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease",
                                }}
                            >
                                {!single && (
                                    <span style={{ display: "flex" }}>
                                        {faces.map((x, n) => (
                                            <span
                                                key={x.i}
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 22,
                                                    marginLeft: n ? -9 : 0,
                                                    overflow: "hidden",
                                                    border: `2px solid ${active ? mk.activeFill : mk.pinFill}`,
                                                    background: t.listed,
                                                    flex: "none",
                                                }}
                                            >
                                                {imageOf(x.home) ? (
                                                    <img
                                                        src={imageOf(x.home)}
                                                        alt=""
                                                        draggable={false}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                        }}
                                                    />
                                                ) : (
                                                    <MasArt seed={x.i} />
                                                )}
                                            </span>
                                        ))}
                                    </span>
                                )}
                                {loved && (
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d={HEART}
                                            fill={
                                                active ? mk.activeInk : ls.heart
                                            }
                                        />
                                    </svg>
                                )}
                                <span>
                                    {text}
                                    {!single && (
                                        <span
                                            style={{
                                                opacity: 0.6,
                                                fontWeight: 500,
                                                marginLeft: 6,
                                            }}
                                        >
                                            {price(lo)}+
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        </div>
                    </div>
                )
            })}

            {/* listing / bundle card */}
            <div
                ref={cardRef}
                data-mx={anchor ? anchor[0] : ""}
                data-my={anchor ? anchor[1] : ""}
                data-lift={46}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerEnter={hold}
                onPointerLeave={(e) => {
                    if (e.pointerType !== "touch") letGo()
                }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cardW,
                    zIndex: 40,
                    pointerEvents: anchor ? "auto" : "none",
                }}
            >
                <AnimatePresence mode="popLayout">
                    {shownHome && (
                        <HomeCard
                            key={"h" + shownHome.i}
                            home={shownHome.home}
                            idx={shownHome.i}
                            s={s}
                            compact={compact}
                            calm={calm}
                            loved={!!hearts[shownHome.i]}
                            onLove={() =>
                                setHearts((k) => ({
                                    ...k,
                                    [shownHome.i]: !k[shownHome.i],
                                }))
                            }
                            pinned={isPickedView}
                            onClose={clearAll}
                            beakRef={beakRef}
                            price={price}
                            ui={ui}
                            label={label}
                            heading={heading}
                        />
                    )}
                    {shownBundle && (
                        <BundleCard
                            key={"g" + shownBundle.key}
                            bundle={shownBundle}
                            s={s}
                            calm={calm}
                            uid={uid}
                            beakRef={beakRef}
                            price={price}
                            ui={ui}
                            onPick={(i) => pickHome(i, true)}
                            onZoom={() => openBundle(shownBundle)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* tap rings */}
            {taps.map((r) => (
                <motion.span
                    key={r.id}
                    initial={{ scale: 0.2, opacity: 0.55 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1] }}
                    onAnimationComplete={() =>
                        setTaps((list) => list.filter((x) => x.id !== r.id))
                    }
                    style={{
                        position: "absolute",
                        left: r.x - 20,
                        top: r.y - 20,
                        width: 40,
                        height: 40,
                        borderRadius: 40,
                        border: `2px solid ${mk.countFill}`,
                        pointerEvents: "none",
                        zIndex: 30,
                    }}
                />
            ))}

            {/* state tooltip */}
            <div
                ref={tipRef}
                style={{
                    ...ui,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 50,
                    pointerEvents: "none",
                    opacity: tipShown ? 1 : 0,
                    transition: "opacity 0.18s ease",
                    padding: 12,
                    minWidth: 180,
                    borderRadius: 16,
                    background: ls.fill,
                    color: ls.ink,
                    whiteSpace: "nowrap",
                    boxShadow: "0 14px 30px rgba(31,43,77,0.22)",
                }}
            >
                <div style={{ fontSize: 14, fontWeight: 650 }}>
                    {hoverArea ? hoverArea.name : ""}
                </div>
                {hoverTally && (
                    <>
                        <div
                            style={{
                                fontSize: 12,
                                color: ls.muted,
                                marginTop: 3,
                            }}
                        >
                            {phrase(
                                "{count} {unit}",
                                { count: hoverTally.count },
                                s.copy
                            )}
                            {" · "}
                            {hoverTally.lo === hoverTally.hi
                                ? price(hoverTally.lo)
                                : `${price(hoverTally.lo)} – ${price(hoverTally.hi)}`}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                            {hoverHomes.slice(0, 4).map((q) => (
                                <div
                                    key={q.i}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        overflow: "hidden",
                                        background: t.listed,
                                    }}
                                >
                                    {imageOf(q.home) ? (
                                        <img
                                            src={imageOf(q.home)}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : (
                                        <MasArt seed={q.i} />
                                    )}
                                </div>
                            ))}
                            {hoverHomes.length > 4 && (
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: ls.line,
                                    }}
                                >
                                    +{hoverHomes.length - 4}
                                </div>
                            )}
                        </div>
                        {s.copy.hoverHint && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginTop: 10,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    color: mk.activeFill,
                                }}
                            >
                                {s.copy.hoverHint}
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* count chip / breadcrumb */}
            {s.chrome.chip && (
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        ...ui,
                        position: "absolute",
                        top: 16,
                        left: 16,
                        zIndex: 60,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 999,
                        background: s.chrome.plate,
                        color: s.chrome.plateInk,
                        border: `1px solid ${mk.pinEdge}`,
                        fontSize: 13,
                        overflow: "hidden",
                        maxWidth: "calc(100% - 80px)",
                        boxShadow: "0 6px 16px rgba(31,43,77,0.16)",
                    }}
                >
                    <AnimatePresence initial={false}>
                        {focus && (
                            <motion.button
                                type="button"
                                key="back"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "auto", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: calm ? 0 : 0.28 }}
                                onClick={leave}
                                style={{
                                    ...ui,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    border: "none",
                                    background: "transparent",
                                    color: "inherit",
                                    fontSize: 13,
                                    padding: "8px 0 8px 14px",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    flex: "none",
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 12H5M11 6l-6 6 6 6" />
                                </svg>
                                {s.copy.back}
                                <span
                                    style={{
                                        opacity: 0.35,
                                        margin: "0 2px 0 6px",
                                    }}
                                >
                                    /
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: focus ? "8px 14px 8px 8px" : "8px 14px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                        }}
                    >
                        {!focus && (
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 6,
                                    background: mk.activeFill,
                                    flex: "none",
                                }}
                            />
                        )}
                        <span
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                            }}
                        >
                            {focus
                                ? phrase(
                                      s.copy.inProvince,
                                      {
                                          count: local.length,
                                          province: focus.name,
                                      },
                                      s.copy
                                  )
                                : phrase(
                                      s.copy.overview,
                                      {
                                          count: pins.length,
                                          provinces: tally.size,
                                      },
                                      s.copy
                                  )}
                        </span>
                    </div>
                </div>
            )}

            {s.chrome.north && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        top: 14,
                        right: 18,
                        zIndex: 60,
                        color: s.chrome.plateInk,
                        fontSize: 10,
                        fontWeight: 600,
                        textAlign: "center",
                        lineHeight: 1,
                        opacity: 0.85,
                        pointerEvents: "none",
                    }}
                >
                    N
                    <svg
                        width="10"
                        height="14"
                        viewBox="0 0 10 14"
                        style={{ display: "block", marginTop: 3 }}
                    >
                        <path
                            d="M5 0 L10 14 L5 10 L0 14 Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            )}

            {s.chrome.scale && (
                <div
                    style={{
                        ...ui,
                        position: "absolute",
                        left: 18,
                        bottom: 14,
                        zIndex: 60,
                        color: s.chrome.plateInk,
                        pointerEvents: "none",
                        fontSize: 11,
                    }}
                >
                    <div
                        ref={barRef}
                        style={{
                            height: 6,
                            borderLeft: `1.5px solid ${s.chrome.plateInk}`,
                            borderRight: `1.5px solid ${s.chrome.plateInk}`,
                            borderBottom: `1.5px solid ${s.chrome.plateInk}`,
                            opacity: 0.7,
                            width: 60,
                            transition: "width 0.2s ease",
                        }}
                    />
                    <div style={{ marginTop: 4, opacity: 0.62 }}>
                        <span ref={barTextRef} />
                        {s.copy.mapNote ? ` · ${s.copy.mapNote}` : ""}
                    </div>
                </div>
            )}

            {s.chrome.zoom && (
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        right: 14,
                        top: 46,
                        zIndex: 60,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    {[
                        { c: "+", f: 1.6, label: "Zoom in" },
                        { c: "−", f: 1 / 1.6, label: "Zoom out" },
                    ].map((b) => (
                        <motion.button
                            key={b.c}
                            type="button"
                            aria-label={b.label}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => nudge(b.f)}
                            style={{
                                ...ui,
                                width: 38,
                                height: 38,
                                borderRadius: 38,
                                border: `1px solid ${mk.pinEdge}`,
                                background: s.chrome.plate,
                                color: s.chrome.plateInk,
                                fontSize: 18,
                                lineHeight: 1,
                                cursor: "pointer",
                                boxShadow: "0 6px 16px rgba(31,43,77,0.16)",
                            }}
                        >
                            {b.c}
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ───────────────────────── cards (live only) ─────────────────────────
const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]
const lift = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}

const HEART =
    "M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.7 1.2-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"

function LoveButton(p: {
    loved: boolean
    calm: boolean
    heart: string
    size: number
    tone: "glass" | "flat"
    ink: string
    onLove: () => void
}) {
    return (
        <motion.button
            type="button"
            aria-label="Save home"
            aria-pressed={p.loved}
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.08 }}
            onClick={(e) => {
                e.stopPropagation()
                p.onLove()
            }}
            style={{
                position: "relative",
                width: p.size,
                height: p.size,
                borderRadius: p.size,
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
                background:
                    p.tone === "glass"
                        ? "rgba(13,22,36,0.45)"
                        : "rgba(13,22,36,0.06)",
                backdropFilter: p.tone === "glass" ? "blur(8px)" : undefined,
                WebkitBackdropFilter:
                    p.tone === "glass" ? "blur(8px)" : undefined,
            }}
        >
            <AnimatePresence>
                {p.loved && !p.calm && (
                    <motion.span
                        key="burst"
                        initial={{ scale: 0.4, opacity: 0.8 }}
                        animate={{ scale: 1.9, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: p.size,
                            border: `2px solid ${p.heart}`,
                        }}
                    />
                )}
            </AnimatePresence>
            <motion.svg
                width={p.size * 0.5}
                height={p.size * 0.5}
                viewBox="0 0 24 24"
                animate={{ scale: p.loved ? [1, 1.35, 1] : 1 }}
                transition={{ duration: 0.35 }}
            >
                <path
                    d={HEART}
                    fill={p.loved ? p.heart : "none"}
                    stroke={
                        p.loved
                            ? p.heart
                            : p.tone === "glass"
                              ? "#FFFFFF"
                              : p.ink
                    }
                    strokeWidth="1.9"
                />
            </motion.svg>
        </motion.button>
    )
}

function CloseButton(p: {
    color: string
    hover: string
    light?: boolean
    onClose: () => void
}) {
    return (
        <motion.button
            type="button"
            aria-label="Close"
            whileHover={{ rotate: 90, backgroundColor: p.hover }}
            onClick={(e) => {
                e.stopPropagation()
                p.onClose()
            }}
            style={{
                width: 26,
                height: 26,
                borderRadius: 26,
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
                background: p.light
                    ? "rgba(13,22,36,0.45)"
                    : "rgba(13,22,36,0)",
                backdropFilter: p.light ? "blur(8px)" : undefined,
                WebkitBackdropFilter: p.light ? "blur(8px)" : undefined,
                color: p.color,
            }}
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            >
                <path d="M6 6l12 12M18 6L6 18" />
            </svg>
        </motion.button>
    )
}

function HomeCard(p: {
    home: Home
    idx: number
    s: Settled
    compact: boolean
    calm: boolean
    loved: boolean
    onLove: () => void
    pinned: boolean
    onClose: () => void
    beakRef: React.RefObject<HTMLDivElement | null>
    price: (v: number) => string
    ui: React.CSSProperties
    label: React.CSSProperties
    heading: React.CSSProperties
}) {
    const { home, s, compact, calm } = p
    const ls = s.listing
    const cp = s.copy
    const src = imageOf(home)
    const href = home.link || ""
    const r = ls.radius
    const inner = Math.max(0, r - 5)
    const rows = [
        { label: cp.bedsLabel, value: home.beds },
        { label: cp.bathsLabel, value: home.baths },
        { label: cp.sizeLabel, value: home.size, unit: cp.sizeUnit },
    ].filter((x) => x.label && x.value !== undefined && x.value !== null) as {
        label: string
        value: number
        unit?: string
    }[]

    const photoLayer = (
        <motion.div
            variants={{
                hidden: { scale: 1.18 },
                show: {
                    scale: 1,
                    transition: { duration: calm ? 0 : 0.9, ease: EASE },
                },
                hover: {
                    scale: 1.06,
                    transition: { duration: 0.6, ease: EASE },
                },
            }}
            style={{ position: "absolute", inset: 0 }}
        >
            {src ? (
                <img
                    src={src}
                    alt={(home.image && home.image.alt) || home.title || ""}
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <MasArt seed={p.idx} />
            )}
        </motion.div>
    )

    // price set in the accent colour, rising in after the photo
    const priceLine = (size: number, color: string) => (
        <motion.div
            variants={{
                hidden: { y: 8, opacity: 0 },
                show: {
                    y: 0,
                    opacity: 1,
                    transition: {
                        duration: calm ? 0 : 0.45,
                        ease: EASE,
                        delay: calm ? 0 : 0.18,
                    },
                },
            }}
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: 3,
                whiteSpace: "nowrap",
                color,
                fontSize: size,
                fontWeight: 760,
                letterSpacing: "-0.02em",
                lineHeight: 1,
            }}
        >
            {p.price(Number(home.price) || 0)}
            <span
                style={{
                    fontSize: Math.round(size * 0.56),
                    fontWeight: 500,
                    color: ls.muted,
                    letterSpacing: 0,
                }}
            >
                {s.pricing.suffix}
            </span>
        </motion.div>
    )

    const cta = (
        <motion.a
            href={href || undefined}
            role={href ? undefined : "button"}
            aria-label={cp.cta}
            target={ls.newTab ? "_blank" : undefined}
            rel={ls.newTab ? "noopener noreferrer" : undefined}
            onClick={(e) => {
                e.stopPropagation()
                if (!href) e.preventDefault()
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
                ...p.ui,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 40,
                width: "100%",
                borderRadius: 999,
                background: ls.buttonFill,
                color: ls.buttonInk,
                fontSize: 13,
                fontWeight: 650,
                textDecoration: "none",
                whiteSpace: "nowrap",
            }}
        >
            {cp.cta}
            <motion.svg
                variants={{ hover: { x: 3 } }}
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M5 12h14M13 6l6 6-6 6" />
            </motion.svg>
        </motion.a>
    )

    return (
        <motion.div
            initial="hidden"
            animate="show"
            exit={{
                opacity: 0,
                y: 6,
                scale: 0.97,
                transition: { duration: calm ? 0 : 0.14 },
            }}
            whileHover="hover"
            variants={{
                hidden: { opacity: 0, y: 14, scale: 0.94 },
                show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        staggerChildren: calm ? 0 : 0.045,
                        delayChildren: calm ? 0 : 0.08,
                    },
                },
            }}
            onClick={() => {
                if (!href || typeof window === "undefined") return
                if (ls.newTab)
                    window.open(href, "_blank", "noopener,noreferrer")
                else window.location.href = href
            }}
            style={{
                ...p.ui,
                position: "relative",
                padding: 5,
                borderRadius: r,
                background: ls.fill,
                color: ls.ink,
                cursor: href ? "pointer" : "default",
                boxShadow:
                    "0 24px 48px rgba(31,43,77,0.22), 0 2px 6px rgba(31,43,77,0.08), 0 0 0 1px rgba(31,43,77,0.05)",
            }}
        >
            <div
                ref={p.beakRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "100%",
                    width: 14,
                    height: 14,
                    marginLeft: -7,
                    marginTop: -7,
                    background: ls.fill,
                    transform: "rotate(45deg)",
                    borderRadius: 3,
                    pointerEvents: "none",
                }}
            />
            {compact ? (
                // ── ticket: photo stub on the left, perforated seam, details and price on the right
                <div style={{ display: "flex", alignItems: "stretch" }}>
                    <motion.div
                        variants={{
                            hidden: {
                                clipPath: `inset(0% 100% 0% 0% round ${inner}px)`,
                            },
                            show: {
                                clipPath: `inset(0% 0% 0% 0% round ${inner}px)`,
                                transition: {
                                    duration: calm ? 0 : 0.5,
                                    ease: EASE,
                                },
                            },
                        }}
                        style={{
                            position: "relative",
                            width: 98,
                            minHeight: 98,
                            flex: "none",
                            overflow: "hidden",
                            borderRadius: inner,
                            background: s.terrain.listed,
                        }}
                    >
                        {photoLayer}
                        {home.tag ? (
                            <span
                                style={{
                                    ...p.label,
                                    position: "absolute",
                                    left: 6,
                                    top: 6,
                                    padding: "3px 6px",
                                    borderRadius: 5,
                                    fontSize: 8,
                                    fontWeight: 650,
                                    textTransform: "uppercase",
                                    background: ls.ribbon,
                                    color: ls.ribbonInk,
                                }}
                            >
                                {home.tag}
                            </span>
                        ) : null}
                    </motion.div>
                    <div
                        style={{
                            width: 1,
                            margin: "4px 10px",
                            flex: "none",
                            backgroundImage: `linear-gradient(${ls.line} 50%, transparent 50%)`,
                            backgroundSize: "1px 6px",
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            padding: "4px 4px 4px 0",
                        }}
                    >
                        <motion.div
                            variants={lift}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    ...p.label,
                                    fontSize: 9,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    color: ls.muted,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    paddingTop: 5,
                                }}
                            >
                                {home.address}
                            </span>
                            {p.pinned ? (
                                <CloseButton
                                    color={ls.muted}
                                    hover={ls.line}
                                    onClose={p.onClose}
                                />
                            ) : (
                                <LoveButton
                                    loved={p.loved}
                                    calm={calm}
                                    heart={ls.heart}
                                    size={26}
                                    tone="flat"
                                    ink={ls.ink}
                                    onLove={p.onLove}
                                />
                            )}
                        </motion.div>
                        <motion.div
                            variants={lift}
                            style={{
                                fontSize: 15,
                                lineHeight: 1.2,
                                ...p.heading,
                                color: ls.ink,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {home.title}
                        </motion.div>
                        <motion.div
                            variants={lift}
                            style={{
                                fontSize: 11.5,
                                color: ls.muted,
                                marginTop: 3,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {rows
                                .map(
                                    (x) =>
                                        `${Number(x.value).toLocaleString("en-GB")} ${x.unit ? x.unit : x.label.toLowerCase().replace(/s$/, Number(x.value) === 1 ? "" : "s")}`
                                )
                                .join(" · ")}
                        </motion.div>
                        <div style={{ marginTop: "auto", paddingTop: 8 }}>
                            {priceLine(17, ls.ribbon)}
                        </div>
                    </div>
                </div>
            ) : (
                // ── postcard: full-bleed photo carrying the title, then price, a spec strip and a pill button
                <>
                    <motion.div
                        variants={{
                            hidden: {
                                clipPath: `inset(0% 0% 100% 0% round ${inner}px)`,
                            },
                            show: {
                                clipPath: `inset(0% 0% 0% 0% round ${inner}px)`,
                                transition: {
                                    duration: calm ? 0 : 0.5,
                                    ease: EASE,
                                },
                            },
                        }}
                        style={{
                            position: "relative",
                            aspectRatio: "4 / 3",
                            overflow: "hidden",
                            borderRadius: inner,
                            background: s.terrain.listed,
                        }}
                    >
                        {photoLayer}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background:
                                    "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.64) 100%)",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                right: 10,
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 8,
                            }}
                        >
                            {home.tag ? (
                                <span
                                    style={{
                                        ...p.label,
                                        padding: "5px 9px",
                                        borderRadius: 999,
                                        fontSize: 9,
                                        fontWeight: 650,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        background: ls.ribbon,
                                        color: ls.ribbonInk,
                                    }}
                                >
                                    {home.tag}
                                </span>
                            ) : (
                                <span />
                            )}
                            <div style={{ display: "flex", gap: 6 }}>
                                <LoveButton
                                    loved={p.loved}
                                    calm={calm}
                                    heart={ls.heart}
                                    size={32}
                                    tone="glass"
                                    ink={ls.ink}
                                    onLove={p.onLove}
                                />
                                {p.pinned && (
                                    <CloseButton
                                        color="#FFFFFF"
                                        hover="rgba(0,0,0,0.6)"
                                        light
                                        onClose={p.onClose}
                                    />
                                )}
                            </div>
                        </div>
                        <motion.div
                            variants={lift}
                            style={{
                                position: "absolute",
                                left: 14,
                                right: 14,
                                bottom: 12,
                                color: "#FFFFFF",
                            }}
                        >
                            <div
                                style={{
                                    ...p.label,
                                    fontSize: 9.5,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    opacity: 0.88,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    minWidth: 0,
                                }}
                            >
                                <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    style={{ flex: "none" }}
                                >
                                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                                    <circle cx="12" cy="9.5" r="2.5" />
                                </svg>
                                <span
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {home.address}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 19,
                                    lineHeight: 1.16,
                                    letterSpacing: "-0.01em",
                                    ...p.heading,
                                    color: "#FFFFFF",
                                    marginTop: 4,
                                    textShadow: "0 1px 12px rgba(0,0,0,0.25)",
                                }}
                            >
                                {home.title}
                            </div>
                        </motion.div>
                    </motion.div>
                    <div style={{ padding: "14px 8px 6px" }}>
                        {priceLine(23, ls.ink)}
                        {rows.length > 0 && (
                            <motion.div
                                variants={lift}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${rows.length}, 1fr)`,
                                    marginTop: 12,
                                    borderTop: `1px solid ${ls.line}`,
                                    borderBottom: `1px solid ${ls.line}`,
                                }}
                            >
                                {rows.map((x, n) => (
                                    <div
                                        key={x.label}
                                        style={{
                                            padding: "9px 0 9px",
                                            paddingLeft: n ? 10 : 0,
                                            borderLeft: n
                                                ? `1px solid ${ls.line}`
                                                : "none",
                                            minWidth: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {Number(x.value).toLocaleString(
                                                "en-GB"
                                            )}
                                            {x.unit ? (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        color: ls.muted,
                                                        marginLeft: 2,
                                                    }}
                                                >
                                                    {x.unit}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div
                                            style={{
                                                ...p.label,
                                                fontSize: 9,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                                color: ls.muted,
                                                marginTop: 3,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {x.label}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        <motion.div variants={lift} style={{ marginTop: 12 }}>
                            {cta}
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    )
}

function BundleCard(p: {
    bundle: Bundle
    s: Settled
    calm: boolean
    uid: string
    beakRef: React.RefObject<HTMLDivElement | null>
    price: (v: number) => string
    ui: React.CSSProperties
    onPick: (i: number) => void
    onZoom: () => void
}) {
    const { bundle, s, calm } = p
    const ls = s.listing
    const rows = bundle.items.slice(0, 4)
    const prices = bundle.items.map((x) => Number(x.home.price) || 0)
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    return (
        <motion.div
            initial="hidden"
            animate="show"
            exit={{
                opacity: 0,
                y: 6,
                scale: 0.97,
                transition: { duration: calm ? 0 : 0.14 },
            }}
            variants={{
                hidden: { opacity: 0, y: 14, scale: 0.94 },
                show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        staggerChildren: calm ? 0 : 0.04,
                        delayChildren: calm ? 0 : 0.05,
                    },
                },
            }}
            style={{
                ...p.ui,
                position: "relative",
                padding: 8,
                borderRadius: ls.radius,
                background: ls.fill,
                color: ls.ink,
                boxShadow:
                    "0 24px 48px rgba(31,43,77,0.22), 0 2px 6px rgba(31,43,77,0.08), 0 0 0 1px rgba(31,43,77,0.05)",
            }}
        >
            <div
                ref={p.beakRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "100%",
                    width: 14,
                    height: 14,
                    marginLeft: -7,
                    marginTop: -7,
                    background: ls.fill,
                    transform: "rotate(45deg)",
                    borderRadius: 3,
                    pointerEvents: "none",
                }}
            />
            <motion.div
                variants={lift}
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "4px 6px 10px",
                }}
            >
                <span style={{ fontSize: 14, fontWeight: 650 }}>
                    {phrase(
                        s.copy.groupTitle,
                        { count: bundle.items.length },
                        s.copy
                    )}
                </span>
                <span style={{ fontSize: 11.5, color: ls.muted }}>
                    {lo === hi
                        ? p.price(lo)
                        : `${p.price(lo)} – ${p.price(hi)}`}
                </span>
            </motion.div>
            {rows.map((q) => (
                <motion.button
                    key={q.i}
                    type="button"
                    variants={lift}
                    className={p.uid + "row"}
                    onClick={(e) => {
                        e.stopPropagation()
                        p.onPick(q.i)
                    }}
                    style={{
                        ...p.ui,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 6,
                        border: "none",
                        borderRadius: 12,
                        background: "transparent",
                        color: "inherit",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                    }}
                >
                    <span
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            overflow: "hidden",
                            flex: "none",
                            background: s.terrain.listed,
                        }}
                    >
                        {imageOf(q.home) ? (
                            <img
                                src={imageOf(q.home)}
                                alt=""
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <MasArt seed={q.i} />
                        )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                            style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {q.home.title}
                        </span>
                        <span
                            style={{
                                display: "block",
                                fontSize: 11.5,
                                color: ls.muted,
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {[
                                q.home.beds !== undefined
                                    ? `${q.home.beds} ${s.copy.bedsLabel.toLowerCase()}`
                                    : "",
                                q.home.baths !== undefined
                                    ? `${q.home.baths} ${s.copy.bathsLabel.toLowerCase()}`
                                    : "",
                                q.home.size
                                    ? `${Number(q.home.size).toLocaleString("en-GB")} ${s.copy.sizeUnit}`
                                    : "",
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                    </span>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {p.price(Number(q.home.price) || 0)}
                    </span>
                </motion.button>
            ))}
            {bundle.items.length > rows.length && (
                <motion.div
                    variants={lift}
                    style={{
                        fontSize: 11.5,
                        color: ls.muted,
                        padding: "4px 6px",
                    }}
                >
                    +{bundle.items.length - rows.length}
                </motion.div>
            )}
            <motion.button
                type="button"
                variants={lift}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                    e.stopPropagation()
                    p.onZoom()
                }}
                style={{
                    ...p.ui,
                    width: "100%",
                    marginTop: 8,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 999,
                    border: "none",
                    background: ls.buttonFill,
                    color: ls.buttonInk,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                >
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.5 4.5M11 8v6M8 11h6" />
                </svg>
                {s.copy.zoomIn}
            </motion.button>
        </motion.div>
    )
}

// ───────────────────────── controls ─────────────────────────
const hue = (title: string, value: string) => ({
    type: ControlType.Color,
    title,
    defaultValue: value,
})
const text = (title: string, value: string) => ({
    type: ControlType.String,
    title,
    defaultValue: value,
})
const flag = (title: string, value: boolean) => ({
    type: ControlType.Boolean,
    title,
    defaultValue: value,
})

addPropertyControls(Mansard, {
    homes: {
        type: ControlType.Array,
        title: "Homes",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: text("Image URL", ""),
                title: text("Title", "New Home"),
                address: text("Address", "Quarter, City"),
                tag: text("Tag", ""),
                price: {
                    type: ControlType.Number,
                    title: "Price",
                    min: 0,
                    max: 100000000,
                    step: 50,
                    defaultValue: 2500,
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    min: 0,
                    max: 100000,
                    step: 1,
                    defaultValue: 85,
                },
                beds: {
                    type: ControlType.Number,
                    title: "Beds",
                    min: 0,
                    max: 50,
                    step: 1,
                    displayStepper: true,
                    defaultValue: 2,
                },
                baths: {
                    type: ControlType.Number,
                    title: "Baths",
                    min: 0,
                    max: 50,
                    step: 0.5,
                    displayStepper: true,
                    defaultValue: 2,
                },
                latitude: {
                    type: ControlType.Number,
                    title: "Latitude",
                    min: 41.3,
                    max: 51.1,
                    step: 0.0001,
                    defaultValue: 48.8566,
                },
                longitude: {
                    type: ControlType.Number,
                    title: "Longitude",
                    min: -5.2,
                    max: 9.6,
                    step: 0.0001,
                    defaultValue: 2.3522,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: HOMES,
    },
    copy: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            one: text("Unit (1)", COPY.one),
            many: text("Unit (2+)", COPY.many),
            overview: text("Overview", COPY.overview),
            inProvince: text("In Region", COPY.inProvince),
            back: text("Back", COPY.back),
            hoverHint: text("Hover Hint", COPY.hoverHint),
            groupTitle: text("Group", COPY.groupTitle),
            zoomIn: text("Zoom In", COPY.zoomIn),
            cta: text("Button", COPY.cta),
            bedsLabel: text("Beds", COPY.bedsLabel),
            bathsLabel: text("Baths", COPY.bathsLabel),
            sizeLabel: text("Size", COPY.sizeLabel),
            sizeUnit: text("Size Unit", COPY.sizeUnit),
            mapNote: text("Map Note", COPY.mapNote),
        },
    },
    pricing: {
        type: ControlType.Object,
        title: "Price",
        controls: {
            currency: text("Currency", PRICING.currency),
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: PRICING.suffix,
                placeholder: " /mo",
            },
            compact: {
                type: ControlType.Boolean,
                title: "Format",
                enabledTitle: "Short",
                disabledTitle: "Full",
                defaultValue: PRICING.compact,
            },
        },
    },
    show: {
        type: ControlType.Object,
        title: "Detail",
        controls: {
            shallows: flag("Coast Lines", SHOW.shallows),
            neighbours: flag("Neighbour Land", SHOW.neighbours),
            regions: flag("Regions", SHOW.regions),
            roads: flag("Roads", SHOW.roads),
            streets: flag("Streets", SHOW.streets),
            towns: flag("Cities", SHOW.towns),
        },
    },
    terrain: {
        type: ControlType.Object,
        title: "Map",
        controls: {
            ocean: hue("Sea", TERRAIN.ocean),
            shallows: hue("Coast Lines", TERRAIN.shallows),
            beach: hue("Shore", TERRAIN.beach),
            neighbour: hue("Neighbour Land", TERRAIN.neighbour),
            land: hue("Land", TERRAIN.land),
            listed: hue("Has Homes", TERRAIN.listed),
            hover: hue("Hover", TERRAIN.hover),
            focus: hue("Selected", TERRAIN.focus),
            border: hue("Borders", TERRAIN.border),
            region: hue("Regions", TERRAIN.region),
            highway: hue("Roads", TERRAIN.highway),
            street: hue("Streets", TERRAIN.street),
            avenue: hue("Avenues", TERRAIN.avenue),
            reserve: hue("Parks", TERRAIN.reserve),
            lake: hue("Lakes", TERRAIN.lake),
            fade: {
                type: ControlType.Number,
                title: "Others Fade",
                min: 0.1,
                max: 1,
                step: 0.05,
                defaultValue: TERRAIN.fade,
            },
        },
    },
    markers: {
        type: ControlType.Object,
        title: "Markers",
        controls: {
            countFill: hue("Count Fill", MARKERS.countFill),
            countInk: hue("Count Text", MARKERS.countInk),
            pinFill: hue("Pin Fill", MARKERS.pinFill),
            pinInk: hue("Pin Text", MARKERS.pinInk),
            pinEdge: hue("Pin Border", MARKERS.pinEdge),
            activeFill: hue("Active Fill", MARKERS.activeFill),
            activeInk: hue("Active Text", MARKERS.activeInk),
            gather: {
                type: ControlType.Number,
                title: "Group Within",
                min: 0,
                max: 160,
                step: 2,
                unit: "px",
                defaultValue: MARKERS.gather,
            },
        },
    },
    listing: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["postcard", "ticket"],
                optionTitles: ["Postcard", "Ticket"],
                displaySegmentedControl: true,
                defaultValue: LISTING.layout,
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 260,
                max: 420,
                step: 4,
                unit: "px",
                defaultValue: LISTING.width,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: LISTING.radius,
            },
            fill: hue("Fill", LISTING.fill),
            ink: hue("Text", LISTING.ink),
            muted: hue("Muted", LISTING.muted),
            line: hue("Divider", LISTING.line),
            ribbon: hue("Accent", LISTING.ribbon),
            ribbonInk: hue("Accent Text", LISTING.ribbonInk),
            heart: hue("Heart", LISTING.heart),
            buttonFill: hue("Button Fill", LISTING.buttonFill),
            buttonInk: hue("Button Text", LISTING.buttonInk),
            newTab: flag("New Tab", LISTING.newTab),
        },
    },
    chrome: {
        type: ControlType.Object,
        title: "Interface",
        controls: {
            chip: flag("Count Chip", CHROME.chip),
            zoom: flag("Zoom Buttons", CHROME.zoom),
            north: flag("North Mark", CHROME.north),
            scale: flag("Scale Bar", CHROME.scale),
            units: {
                type: ControlType.Enum,
                title: "Units",
                options: ["km", "mi"],
                optionTitles: ["km", "mi"],
                displaySegmentedControl: true,
                defaultValue: CHROME.units,
            },
            wheel: {
                type: ControlType.Enum,
                title: "Wheel Zoom",
                options: ["pinch", "always", "off"],
                optionTitles: ["Pinch", "Always", "Off"],
                displaySegmentedControl: true,
                defaultValue: CHROME.wheel,
            },
            names: flag("Region Names", CHROME.names),
            plate: hue("Fill", CHROME.plate),
            plateInk: hue("Text", CHROME.plateInk),
        },
    },
    glide: {
        type: ControlType.Number,
        title: "Zoom Time",
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
        defaultValue: 1.1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 20,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 19, lineHeight: 1.18, letterSpacing: -0.2 },
    },
    uiFont: {
        type: ControlType.Font,
        title: "UI Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "basic",
        defaultFontType: "monospace",
    },
})
