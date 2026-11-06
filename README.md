# 🏛️ Catpera Symphony

![Catpera Symphony Banner](https://via.placeholder.com/1000x300/020202/ffffff?text=Catpera+Symphony+-+Interactive+3D+Orchestra)

> **웹 브라우저에서 펼쳐지는 3D 인터랙티브 고양이 교향악단 🎻** > `Tone.js`의 강력한 오디오 엔진과 `Three.js(R3F)`의 3D 렌더링을 결합하여, MIDI 데이터에 맞춰 실시간으로 반응하는 고성능 시청각 시뮬레이터입니다.

<br/>

## 🛠 Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Core** | ![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E) | 전역 상태 관리 및 초고속 빌드 환경 |
| **3D Rendering** | ![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white) ![R3F](https://img.shields.io/badge/React_Three_Fiber-000000?style=for-the-badge&logo=react&logoColor=white) | GPU 가속 기반 3D 환경 렌더링 및 최적화 |
| **Audio Engine** | ![Tone.js](https://img.shields.io/badge/Tone.js-000000?style=for-the-badge) ![MIDI](https://img.shields.io/badge/@tonejs/midi-FF8C00?style=for-the-badge) | MIDI 파싱, 스케줄링 및 웹 오디오 합성 |

<br/>

## ✨ Key Features

- **동적 오케스트라 배치**: 파싱된 MIDI 트랙 수와 악기군(`instrument.family`)에 따라 원형 단상(Curved Stage) 위에 연주자들을 자동으로 레이아웃합니다.
- **실시간 오디오-비주얼 동기화**: `requestAnimationFrame`을 통해 오디오 진행도와 3D 애니메이션(메쉬 크기, 회전, 발광 효과)을 60fps로 완벽하게 동기화합니다.
- **절차적 텍스처(Procedural Texture) 생성**: 외부 이미지 의존성 없이 Canvas API를 활용하여 지휘자석의 악보를 코드로 직접 그리고, 곡 진행도(10% 단위)에 따라 페이지를 자동으로 넘깁니다.
- **InstancedMesh 렌더링 최적화**: 수천 개의 환경 프랍(조약돌, 풀, 연석, 기둥)을 단 한 번의 Draw Call로 처리하여 브라우저 메모리와 성능 병목을 해결했습니다.

<br/>

## 🏗 Architecture & State Management

앱의 상태는 **단일 진실 공급원(Single Source of Truth)** 패턴을 유지하며, 렌더링 최적화를 위해 상태(State)와 파생 데이터(Derived Data)를 철저히 분리했습니다.

```javascript
// 핵심 상태 (Core States)
const [playback, setPlayback] = useState({ isPlaying: false, current: 0, duration: 0 });
const [parsedTracks, setParsedTracks] = useState([]);

// 파생 데이터 (Derived States - useMemo 활용)
const { rows, settings } = useMemo(() => computeLayout(parsedTracks), [parsedTracks]);
const currentPage = Math.min(Math.floor((playback.current / playback.duration) * 10), 9);
```

<br/>

## ⚙️ Implementation Details

<details>
<summary><b>1. MIDI 파싱 및 악기군 자동 분류 로직</b></summary>
<div markdown="1">

`Midi.fromUrl()`을 통해 데이터를 로드한 후, 각 트랙의 `instrument.family`를 분석하여 오케스트라의 전통적인 좌석 배치와 고유의 조명 색상(Aura)을 부여합니다.

* **Strings / Piano** (전면 배치): `#4facf7` (푸른빛)
* **Brass / Woodwinds** (중앙 배치): `#f7d04f` (금빛)
* **Percussion / Bass** (후면 배치): `#f75b4f`, `#b64ff7` (붉은빛/보랏빛)

</div>
</details>

<details>
<summary><b>2. 극좌표계(Polar Coordinates) 기반의 동적 레이아웃</b></summary>
<div markdown="1">

1열부터 3명, 5명, 7명 등 수열 규칙으로 트랙을 할당한 뒤, `Math.cos`와 `Math.sin`을 활용해 지휘자(원점)를 바라보는 둥근 부채꼴 형태의 `[x, y, z]` 좌표와 회전각(`rotation.y`)을 계산합니다. 계산 비용을 줄이기 위해 `useMemo`로 캐싱합니다.

</div>
</details>

<details>
<summary><b>3. InstancedGroup을 통한 대규모 프랍 최적화</b></summary>
<div markdown="1">

`THREE.InstancedMesh`를 래핑한 공용 컴포넌트를 설계하여, 수천 개의 정적 오브젝트를 그릴 때 발생하는 오버헤드를 제거했습니다.

```javascript
// InstancedGroup 컴포넌트 일부
useLayoutEffect(() => {
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    onSetup(dummy, i); // 개별 위치, 회전, 스케일 수학적 계산
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(i, dummy.matrix);
  }
  meshRef.current.instanceMatrix.needsUpdate = true;
}, [count, geo, mat]);
```

</div>
</details>

<details>
<summary><b>4. 시네마틱 카메라 & Glassmorphism UI</b></summary>
<div markdown="1">

* **카메라 제어**: `OrbitControls`의 `enablePan={false}` 및 `dampingFactor={0.03}` 설정을 통해 무대 이탈을 방지하고 묵직하고 시네마틱한 뷰를 제공합니다.
* **UI 디자인**: `backdrop-filter: blur()`를 활용한 모던 글래스모피즘(Glassmorphism) 하단 바를 구현했으며, 온전한 감상을 위해 UI를 숨길 수 있는 토글 기능을 제공합니다.

</div>
</details>

## 배포 자료

기존 MIDI는 새로 만든 예제로 교체했습니다. 캐릭터 3D 모델은 K-Lunatic이 제작한 원본을 포함합니다.

[MIT 라이선스](LICENSE) · [외부 자료 안내](THIRD_PARTY_NOTICES.md)

[개발 기록](DEVELOPMENT.md)
