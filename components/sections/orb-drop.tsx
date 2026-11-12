import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

// Orb Drop — 사진이 든 유리 구슬이 쏟아져 쌓이고, 커서로 헤집는다.
// 물리는 구-구/벽 충돌뿐이라 직접 푼다 — rapier 같은 wasm 의존성 없이 three.js만.

// 직교 카메라 — 원근이면 가장자리 구가 타원으로 찌그러진다. 실루엣 = 반지름이라 벽/바닥 계산도 단순
const WORLD_H = 2 // 프레임 높이 = 월드 2단위 — 반지름·중력 전부 이 스케일
const HALF_H = WORLD_H / 2
const SLAB = 0.14 // 앞뒤(z) 여유 — 두께감만
const ITER = 4 // 충돌 완화 반복
const MAX_BALLS = 120 // 충돌 검사가 O(n²)라 이 위로는 프레임이 떨어진다
const PACK = 1.25 // 실측 보정 — z로도 겹쳐 쌓여 격자 추정보다 많이 들어간다
const FILL = 0.4 // 더미가 차오르는 높이 비율(실측 ~45%) — 개수는 여기서 역산
const DROP_WINDOW = 1.6 // 첫 공~끝 공 낙하 시차(초)
const DROP_H = 1.2 // 프레임 위 낙하 시작 높이
// 사선 진입 초속 — 바닥에서 솟는 토스는 시도했다 뺐음(빈 바닥에서 갑자기 튀어나와 글리치)
const DRIFT = 1.2 // 가로 최대
const PLUNGE = 1.2 // 세로 최대
const TUMBLE = 4 // 낙하 중 텀블링 최대(rad/s)
const ANG_DAMP = 0.97
// 중력·반발은 노출 안 함 — 캔버스(정지 프레임)에선 차이가 안 보여 혼란만 줬다
// ponytail: 필요해지면 g·bounce·낙하시차를 세트로 묶은 프리셋으로
const GRAV = 5
const BOUNCE = 0.42 // 가라앉는 시간 = 애니메이션 길이 — 이 근처가 무난
const FLOOR_FRICTION = 0.96
const SETTLE_STEPS = 900 // 캔버스 정지 프레임용 사전 시뮬 상한
const DT = 1 / 60
const REST_V = 0.012 // 이 속도 아래면 정지 → RAF를 끈다
const REST_FRAMES = 24
const POKE_R = 0.55 // 커서 반발 반경
const POKE_F = 6 // 커서 반발 세기

// 유리 룩 — 프리뷰 하네스에서 눈으로 맞춘 값
const RIM_STRENGTH = 0.38
const RIM_POWER = 3.5
const SPEC_POWER = 140.0
const BULGE = 0.96 // asin 렌즈 왜곡 — 1에 가까울수록 가장자리 압축이 세다
const EDGE_DARK = 0.42 // 가장자리 음영 — 없으면 사진이 유리 속이 아니라 스티커로 보인다
// 색 보정은 없다("원본 색 그대로"가 요구사항). ZOOM은 역산:
// 렌즈 매핑 t(r) = asin(r·B)/asin(B)/ZOOM, "원본 중앙 SUBJ가 구슬 반경 TARGET을 차지" → 아래 식
const SUBJ = 0.6
const TARGET = 0.85
const ZOOM = Math.asin(TARGET * BULGE) / Math.asin(BULGE) / SUBJ

const FALLBACK_ROWS = [40, 39] // 정적 폴백 줄당 공 개수 — 넉넉히 깔고 잘라 쓴다

// 이미지 없이 설치해도 공이 비어 보이지 않게
const PLACEHOLDER_HUES = [
    [340, 20],
    [200, 260],
    [30, 350],
    [150, 200],
]

function makeOrbTexture(hueA: number, hueB: number) {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const g = c.getContext("2d")!
    const grad = g.createLinearGradient(0, 0, 0, 128)
    grad.addColorStop(0, `hsl(${hueA}, 85%, 74%)`)
    grad.addColorStop(1, `hsl(${hueB}, 80%, 58%)`)
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
}

interface Orb {
    mesh: THREE.Group // [사진 원판, 유리 셸]
    photo: THREE.Mesh // 사진 원판만 z축 회전 — 셸까지 돌리면 하이라이트가 같이 돌아 이상해진다
    p: THREE.Vector3
    v: THREE.Vector3
    w: number // 화면면(z축) 각속도 — 원판이 2D라 스칼라면 충분
    r: number
    at: number // 낙하 시작 시각(초)
    landed: boolean // 한 번 바닥에 닿았으면 천장이 생긴다 — 커서로 밀어도 프레임 밖으로 못 나감
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OrbDrop(props) {
    const { style, images, size } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    // 씬 재생성 없이 매 프레임 라이브로 읽는다 — 슬라이더 드래그가 매끄럽게
    const sizeRef = useRef(size)
    sizeRef.current = size
    const refreshRef = useRef<() => void>()

    const [fallback, setFallback] = useState(false)

    // useIsStaticRenderer는 편집 캔버스에서도 true다. 캔버스는 3D를 "정지 프레임"으로 그린다 —
    // 애니메이션·포인터가 없어 심사에 걸리지 않고, 구매자가 캔버스에서 실물을 그대로 본다.
    // 익스포트/썸네일/SSR만 CSS 폴백. (05-custom-can이 이 패턴으로 통과)
    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const live = !isStatic || onCanvas
    const interactive = live && !onCanvas

    const urls: string[] = (images || [])
        .map((i: any) => i?.src)
        .filter(Boolean)
    const urlKey = urls.join("|")

    useEffect(() => {
        if (!live) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        let renderer: THREE.WebGLRenderer
        try {
            renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
            })
        } catch {
            setFallback(true)
            return
        }
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

        const scene = new THREE.Scene()

        const camera = new THREE.OrthographicCamera(
            -HALF_H,
            HALF_H,
            HALF_H,
            -HALF_H,
            0.01,
            100
        )
        camera.position.z = 5 // 직교라 거리는 클리핑만 안 걸리면 무관

        // ── 유리 껍질 (전 공 공유) — 프레넬 림 + 스펙큘러 점 + 윗면 광택. 중앙은 투명해서 사진이 선명 ──
        const shellMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uLight: { value: new THREE.Vector3(1.5, 4, 3).normalize() },
            },
            vertexShader: `
                varying vec3 vN, vV;
                void main() {
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    vN = normalMatrix * normal;
                    vV = -mv.xyz;
                    gl_Position = projectionMatrix * mv;
                }`,
            fragmentShader: `
                uniform vec3 uLight;
                varying vec3 vN, vV;
                void main() {
                    vec3 n = normalize(vN);
                    vec3 v = normalize(vV);
                    float fr = pow(1.0 - abs(dot(n, v)), ${RIM_POWER.toFixed(2)});
                    vec3 l = normalize((viewMatrix * vec4(uLight, 0.0)).xyz);
                    float spec = pow(max(dot(reflect(-l, n), v), 0.0), ${SPEC_POWER.toFixed(2)}) * 1.2;
                    float spec2 = pow(max(dot(reflect(normalize(vec3(0.6, 0.5, -0.4)), n), v), 0.0), ${(SPEC_POWER * 0.6).toFixed(2)}) * 0.5;
                    float sheen = smoothstep(0.15, 0.85, n.y) * fr * 0.35;
                    // 실루엣 근처는 어두운 유리(흰 배경에서도 구형이 읽힘) — 흰 끝단은 어색해서 뺐다
                    vec3 rimCol = vec3(0.30, 0.34, 0.40);
                    float a = clamp(fr * ${RIM_STRENGTH.toFixed(2)} + spec + spec2 + sheen, 0.0, 0.95);
                    vec3 col = (rimCol * fr * ${RIM_STRENGTH.toFixed(2)} + vec3(1.0) * (spec + spec2 + sheen)) / max(a, 1e-4);
                    gl_FragColor = vec4(col, a);
                    #include <colorspace_fragment>
                }`,
        })

        // ── 사진 원판 — 구 실루엣을 꽉 채우고 asin 렌즈 왜곡. 직교 투영이라 정면 고정이면 실루엣과 일치 ──
        const photoFrag = `
            uniform sampler2D uMap;
            uniform vec2 uRepeat, uOffset;
            varying vec2 vUv;
            void main() {
                vec2 d = vUv - 0.5;
                float r = min(length(d) * 2.0, 1.0);
                // 숫자는 전부 toFixed로 박는다 — 1.0 같은 값이 "1"로 들어가면 GLSL이 int 취급해 컴파일이 깨진다
                float f = asin(r * ${BULGE.toFixed(2)}) / asin(${BULGE.toFixed(2)}); // 중앙 확대, 가장자리 압축
                vec2 uv = 0.5 + (r > 1e-5 ? normalize(d) * f * 0.5 / ${ZOOM.toFixed(4)} : vec2(0.0));
                vec3 col = texture2D(uMap, uOffset + uRepeat * uv).rgb;
                col *= 1.0 - smoothstep(0.72, 1.0, r) * ${EDGE_DARK.toFixed(2)}; // 구 가장자리 감쇠
                gl_FragColor = vec4(col, 1.0);
                #include <colorspace_fragment>
            }`
        const photoVert = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`

        const placeholders = PLACEHOLDER_HUES.map(([a, b]) =>
            makeOrbTexture(a, b)
        )
        const owned: THREE.Texture[] = [...placeholders]
        const mats = (urls.length ? urls : placeholders).map(
            (_, i) =>
                new THREE.ShaderMaterial({
                    uniforms: {
                        uMap: { value: placeholders[i % placeholders.length] }, // 사진은 로드되면 갈아끼운다
                        uRepeat: { value: new THREE.Vector2(1, 1) },
                        uOffset: { value: new THREE.Vector2(0, 0) },
                    },
                    vertexShader: photoVert,
                    fragmentShader: photoFrag,
                })
        )

        if (urls.length) {
            const loader = new THREE.TextureLoader()
            loader.setCrossOrigin("anonymous")
            urls.forEach((url, i) =>
                loader.load(
                    url,
                    (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace
                        tex.anisotropy =
                            renderer.capabilities.getMaxAnisotropy()
                        owned.push(tex)
                        const u = mats[i].uniforms
                        u.uMap.value = tex
                        // cover-crop: 정사각 중앙만 쓴다 — 어떤 비율이 와도 구슬 안에서 안 늘어난다
                        const iw = tex.image.width
                        const ih = tex.image.height
                        if (iw > ih) {
                            u.uRepeat.value.set(ih / iw, 1)
                            u.uOffset.value.set((1 - ih / iw) / 2, 0)
                        } else {
                            u.uRepeat.value.set(1, iw / ih)
                            u.uOffset.value.set(0, (1 - iw / ih) / 2)
                        }
                        requestRender()
                    },
                    undefined,
                    // 실패해도 플레이스홀더 텍스처가 남는다(조용한 대체 상태)
                    () => console.warn("Orb Drop: image failed to load:", url)
                )
            )
        }

        const shellGeo = new THREE.SphereGeometry(1, 32, 24) // 반지름 1 → 공마다 scale로 크기
        const photoGeo = new THREE.CircleGeometry(0.995, 64) // 구 실루엣 전체를 덮는다
        const orbs: Orb[] = []
        let halfW = HALF_H // 첫 fit 전 임시값
        let t = 0

        // 상한만큼 미리 만들고 실제 쓰는 개수(active)는 프레임에서 계산한다 — 개수를 직접 받으면
        // 프레임에 들어갈지를 구매자가 암산해야 하고, 넘친 공은 화면 밖에 쌓여 사라진 것처럼 보인다.
        for (let i = 0; i < MAX_BALLS; i++) {
            const mesh = new THREE.Group()
            const photo = new THREE.Mesh(photoGeo, mats[i % mats.length])
            mesh.add(photo)
            mesh.add(new THREE.Mesh(shellGeo, shellMat)) // 사진(불투명) 먼저, 셸(투명)은 그 위에
            mesh.visible = false
            scene.add(mesh)
            orbs.push({
                mesh,
                photo,
                p: new THREE.Vector3(0, HALF_H + DROP_H, 0),
                v: new THREE.Vector3(),
                w: 0,
                r: 0.2, // applyLayout()이 Ball size로 다시 잡는다
                at: 0,
                landed: false,
            })
        }
        let active = 0

        function seedOrb(o: Orb, at: number) {
            const x = (Math.random() * 2 - 1) * Math.max(halfW - o.r, 0)
            const z = (Math.random() * 2 - 1) * SLAB
            const dir = Math.random() < 0.5 ? -1 : 1
            o.p.set(x, HALF_H + DROP_H + Math.random() * DROP_H, z)
            o.v.set(dir * Math.random() * DRIFT, -Math.random() * PLUNGE, 0)
            o.photo.rotation.z = Math.random() * Math.PI * 2
            o.w = (Math.random() - 0.5) * TUMBLE
            o.at = at
            o.landed = false
            o.mesh.visible = false
        }

        // 개수는 받지 않고 역산한다 — FILL 높이까지 채우는 데 필요한 격자 칸 수
        function applyLayout() {
            // 프레임보다 큰 공은 가둘 수 없다
            const r = Math.min((sizeRef.current / 100) * HALF_H, HALF_H * 0.9)
            for (const o of orbs) {
                o.r = r
                o.mesh.scale.setScalar(r)
            }
            const d = 2 * r
            const cells = ((halfW * 2) / d) * ((WORLD_H * FILL) / d) * PACK
            const next = Math.max(1, Math.min(MAX_BALLS, Math.round(cells)))
            // 늘어난 만큼만 새로 떨어뜨린다 — 이미 쌓인 더미는 그대로
            for (let i = active; i < next; i++) seedOrb(orbs[i], t)
            for (let i = next; i < MAX_BALLS; i++) orbs[i].mesh.visible = false
            active = next
        }

        // 첫 낙하 — 폭·개수가 정해진 뒤(첫 fit) 시차를 두고 뿌린다
        function reseed() {
            t = 0
            const gap = DROP_WINDOW / Math.max(active, 1)
            for (let i = 0; i < MAX_BALLS; i++) {
                seedOrb(orbs[i], i * gap * (0.6 + Math.random() * 0.8))
            }
        }

        // ── 물리 ── 위치 기반 완화(PBD): 적분 → 겹침 분리 → 법선 방향 반발.
        // ponytail: 쌍 검사는 O(n²) — MAX_BALLS(120)면 프레임당 7천 쌍, 공간 격자는 그 위에서 필요해지면.
        const pokeAt = new THREE.Vector3()
        let pokeT = -Infinity // 커서가 멈추면 반발도 멈춰야 RAF가 잠든다
        let poking = false
        const _n = new THREE.Vector3()
        const _rel = new THREE.Vector3()

        function step(dt: number) {
            t += dt
            const e = BOUNCE
            for (let i = 0; i < active; i++) {
                const o = orbs[i]
                if (t < o.at) continue
                o.mesh.visible = true
                o.v.y -= GRAV * dt
                if (poking) {
                    _n.copy(o.p).sub(pokeAt)
                    _n.z = 0
                    const d = _n.length()
                    if (d < POKE_R + o.r && d > 1e-4) {
                        o.v.addScaledVector(
                            _n.divideScalar(d),
                            POKE_F * (1 - d / (POKE_R + o.r)) * dt * 60
                        )
                    }
                }
                // 한 프레임 이동이 반지름을 넘으면 벽을 뚫는다 — 커서가 세게 밀어도 못 나가게
                const vmax = o.r / dt
                if (o.v.lengthSq() > vmax * vmax) o.v.setLength(vmax)
                o.p.addScaledVector(o.v, dt)
            }

            for (let k = 0; k < ITER; k++) {
                for (let i = 0; i < active; i++) {
                    const a = orbs[i]
                    if (t < a.at) continue
                    for (let j = i + 1; j < active; j++) {
                        const b = orbs[j]
                        if (t < b.at) continue
                        _n.copy(b.p).sub(a.p)
                        const d = _n.length()
                        const gap = a.r + b.r - d
                        if (gap <= 0 || d < 1e-6) continue
                        _n.divideScalar(d)
                        // 질량은 모두 같다 — 공 크기가 전부 같으니 반씩 밀어내면 끝
                        a.p.addScaledVector(_n, -gap / 2)
                        b.p.addScaledVector(_n, gap / 2)
                        _rel.copy(b.v).sub(a.v)
                        const vn = _rel.dot(_n)
                        if (vn < 0) {
                            const jn = (-(1 + e) * vn) / 2
                            a.v.addScaledVector(_n, -jn)
                            b.v.addScaledVector(_n, jn)
                        }
                    }
                    // 벽·바닥 = 프레임의 실제 네 변. 직교 투영이라 실루엣 = 반지름 그대로
                    const xw = Math.max(halfW - a.r, 0)
                    if (a.p.x < -xw) {
                        a.p.x = -xw
                        if (a.v.x < 0) a.v.x *= -e
                    } else if (a.p.x > xw) {
                        a.p.x = xw
                        if (a.v.x > 0) a.v.x *= -e
                    }
                    if (Math.abs(a.p.z) > SLAB) {
                        a.p.z = Math.sign(a.p.z) * SLAB
                        a.v.z *= -e
                    }
                    const floor = -HALF_H + a.r
                    if (a.p.y < floor) {
                        a.p.y = floor
                        if (a.v.y < 0) a.v.y *= -e
                        a.v.x *= FLOOR_FRICTION
                        a.v.z *= FLOOR_FRICTION
                        a.landed = true
                        a.w = -a.v.x / a.r // 미끄러지지 않고 구른다 — +x로 가면 시계방향
                    }
                    // 착지한 공만 천장으로 막는다 — 낙하 중인 공은 프레임 위에서 들어와야 하니 제외
                    const ceil = HALF_H - a.r
                    if (a.landed && a.p.y > ceil) {
                        a.p.y = ceil
                        if (a.v.y > 0) a.v.y *= -e
                    }
                }
            }

            let moving = false
            for (let i = 0; i < active; i++) {
                const o = orbs[i]
                if (!o.mesh.visible) {
                    moving = true // 아직 안 떨어진 공이 남았다
                    continue
                }
                // 회전이 남아 있으면 계속 그린다 — 접선속도(w·r)로 환산해 이동 기준과 같은 문턱
                if (
                    o.v.lengthSq() > REST_V * REST_V ||
                    Math.abs(o.w) * o.r > REST_V
                )
                    moving = true
                o.w *= ANG_DAMP
                o.photo.rotation.z += o.w * dt
                o.mesh.position.copy(o.p)
            }
            return moving
        }

        function fit() {
            const w = container.clientWidth
            const h = container.clientHeight
            if (w <= 0 || h <= 0) return false
            renderer.setSize(w, h, false)
            halfW = HALF_H * (w / h)
            camera.left = -halfW
            camera.right = halfW
            camera.updateProjectionMatrix()
            applyLayout()
            return true
        }

        // 편집 캔버스 — RAF 없이 미리 굴려 쌓인 한 프레임만. 애니메이션이 아니라 심사에 안 걸린다.
        function settle() {
            if (!fit()) return
            reseed()
            for (let i = 0; i < active; i++) orbs[i].at = 0 // 시차는 정지 프레임에선 의미 없다
            for (let i = 0; i < SETTLE_STEPS && step(DT); i++) {}
            renderer.render(scene, camera)
        }

        // ── 렌더 루프 ── 유휴 시 스스로 멈춘다. 화면 밖에서 RAF가 계속 도는 게 마켓 반려 사유라
        // 움직임이 있고 && 화면에 보일 때만 다음 프레임을 잡는다. 재개는 requestRender()로.
        let running = false
        let visible = false
        let needFit = true
        let seeded = false
        let rest = 0
        let lastT = performance.now()
        let raf = 0

        function frame() {
            raf = 0
            if (needFit && fit()) {
                needFit = false
                if (!seeded) {
                    reseed()
                    seeded = true
                }
            }
            const now = performance.now()
            // 재개 시 클록 리셋 — 화면 밖에 있던 시간만큼 점프하지 않게
            const dt = Math.min((now - lastT) / 1000, 0.05)
            lastT = now
            // 커서가 프레임 안에 가만히 있어도 반발이 계속 걸리면 루프가 영원히 안 잠든다
            poking = now - pokeT < 150

            const moving = step(dt)
            renderer.render(scene, camera)

            rest = moving || poking ? 0 : rest + 1
            if (visible && (rest < REST_FRAMES || needFit))
                raf = requestAnimationFrame(frame)
            else running = false
        }

        function requestRender() {
            rest = 0
            if (!running && visible) {
                running = true
                lastT = performance.now()
                raf = requestAnimationFrame(frame)
            }
        }

        function onMove(e: PointerEvent) {
            const rect = container.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            pokeAt.set(
                ((e.clientX - rect.left) / rect.width - 0.5) * 2 * halfW,
                -((e.clientY - rect.top) / rect.height - 0.5) * WORLD_H,
                0
            )
            pokeT = performance.now()
            requestRender()
        }
        function onLeave() {
            pokeT = -Infinity
        }
        // Framer가 마운트 직후 0을 주기도 해서 needFit으로 다음 프레임에 다시 맞춘다
        const ro = new ResizeObserver(() => {
            needFit = true
            if (interactive) requestRender()
            else settle()
        })
        ro.observe(container)

        let io: IntersectionObserver | undefined
        // 캔버스에선 포인터를 붙이지 않는다 — 에디터의 레이어 선택·이동을 가로채지 않게
        if (interactive) {
            container.addEventListener("pointermove", onMove)
            container.addEventListener("pointerleave", onLeave)
            // 크기 슬라이더는 공을 다시 떨어뜨리지 않고 반지름만 갱신 → needFit으로 다음 프레임에 반영
            refreshRef.current = () => {
                needFit = true
                requestRender()
            }
            io = new IntersectionObserver(
                ([entry]) => {
                    visible = entry.isIntersecting
                    if (visible) requestRender()
                },
                { threshold: 0.01 }
            )
            io.observe(container)
        } else {
            refreshRef.current = settle // 캔버스: 속성이 바뀌면 다시 굴려 새 정지 프레임
            settle()
        }

        return () => {
            io?.disconnect()
            ro.disconnect()
            cancelAnimationFrame(raf)
            visible = false // 늦게 도착한 텍스처 콜백이 dispose된 렌더러로 루프를 되살리지 못하게
            refreshRef.current = undefined
            container.removeEventListener("pointermove", onMove)
            container.removeEventListener("pointerleave", onLeave)
            dispose()
        }

        function dispose() {
            shellGeo.dispose()
            photoGeo.dispose()
            shellMat.dispose()
            owned.forEach((tx) => tx.dispose())
            mats.forEach((m) => m.dispose())
            renderer.dispose()
        }
    }, [live, interactive, urlKey])

    // 정지한 뒤 슬라이더만 움직여도 다시 굴린다(공은 그대로 — 다시 떨어뜨리지 않는다)
    useEffect(() => {
        refreshRef.current?.()
    }, [size])

    const showDom = fallback || !live

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                overflow: "hidden",
                pointerEvents: "auto",
            }}
        >
            {/* 정적 렌더(캔버스/썸네일/익스포트/SSR)·WebGL 폴백 — 쌓인 인상만 CSS로. 측정을 못 하니
                넉넉히 깔고 프레임 밖은 잘리게 둔다. 순수 장식이라 스크린리더에서 감춘다 */}
            {showDom &&
                FALLBACK_ROWS.map((cols, r) => (
                    <div
                        key={r}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0, // 공 높이(%)가 프레임 높이 기준으로 잡히려면 줄이 높이를 가져야 한다
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center", // 줄마다 개수가 홀짝이라 반 칸씩 어긋난다
                        }}
                    >
                        {Array.from({ length: cols }).map((_, i) => {
                            const hue =
                                PLACEHOLDER_HUES[
                                    (i + r) % PLACEHOLDER_HUES.length
                                ]
                            const src = urls.length
                                ? urls[(i + r) % urls.length]
                                : ""
                            // 사진 기울기 — SSR과 클라이언트가 같은 값을 내야 해서 랜덤 대신 결정적 수열
                            const tilt = ((i * 47 + r * 83) % 360) - 180
                            return (
                                <div
                                    key={i}
                                    style={{
                                        height: `${size}%`,
                                        aspectRatio: "1",
                                        flex: "0 0 auto",
                                        position: "relative",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        transform: `translateY(-${r * 80}%)`, // 자기 지름의 80%씩 위로 = 윗줄
                                    }}
                                >
                                    {/* 사진만 기울인다 — 정사각은 어떤 각도로 돌려도 내접원을 다 덮는다 */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            transform: `rotate(${tilt}deg)`,
                                            background: src
                                                ? `url("${src}") center / cover no-repeat`
                                                : `linear-gradient(135deg, hsl(${hue[0]}, 85%, 74%), hsl(${hue[1]}, 80%, 58%))`,
                                        }}
                                    />
                                    {/* 유리 오버레이는 안 돈다 — 하이라이트는 항상 좌상단 */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background:
                                                "radial-gradient(circle at 36% 28%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 11%), radial-gradient(circle, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 97%)",
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                ))}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: showDom ? "none" : "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

OrbDrop.defaultProps = {
    size: 22,
}

addPropertyControls(OrbDrop, {
    images: {
        type: ControlType.Array,
        title: "Photos",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 5,
        description:
            "The center square is cropped and magnified through the glass, so keep the subject near the middle.",
    },
    size: {
        type: ControlType.Number,
        title: "Ball size",
        defaultValue: 22,
        min: 6,
        max: 50,
        step: 1,
        unit: "%",
        description:
            "The pile always fills about half the frame — bigger marbles just means fewer of them.\n\nExplore more components at [mx.bear](https://www.framer.com/%40mxbear/?tab=marketplace)",
    },
})
