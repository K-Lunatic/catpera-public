import React, { useState, useRef, Suspense, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

import { CONFIG, GEO, MAT, ISLAND_ROCKS, getTrackInfo, getSeededRandom } from './constants';
import { FloatingIslandRocks, InstancedGroup, RuinedArch, FloatingDebris, MajesticPillar } from './components/Island';
import { AnimalCharacter } from './components/CatCharacter';
import { ConductorStand, CurvedStage } from './components/Stage';
import { ControlPanel } from './components/ControlPanel';

const islandCollider = new THREE.Group();
ISLAND_ROCKS.forEach(r => {
  const topMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0));
  topMesh.position.set(0, r.scale[1] * 0.08, 0); 
  topMesh.scale.set(r.scale[0] * 0.98, r.scale[1] * 0.98, r.scale[2] * 0.98);
  const parent = new THREE.Group();
  parent.position.set(...r.pos); parent.rotation.set(...r.rot); parent.add(topMesh);
  parent.updateMatrixWorld(true); islandCollider.add(parent);
});

const raycaster = new THREE.Raycaster();
const downVec = new THREE.Vector3(0, -1, 0);

const getSurfacePoint = (avoidStage = false, targetX = null, targetZ = null, seed = 0) => {
  let hit = null; let attempts = 0;
  while (!hit && attempts < 50) {
    let x, z;
    if (targetX !== null) {
      x = targetX; z = targetZ;
    } else {
      x = (getSeededRandom(seed, attempts, 100) - 0.5) * 140;
      z = (getSeededRandom(seed, attempts, 200) - 0.5) * 140;
    }
    
    const r = Math.sqrt(x * x + z * z);
    if (avoidStage && targetX === null && r < 27) { attempts++; continue; }

    raycaster.set(new THREE.Vector3(x, 50, z), downVec);
    const intersects = raycaster.intersectObject(islandCollider, true);
    
    if (intersects.length > 0) { hit = intersects[0].point; } 
    else if (targetX !== null) { hit = new THREE.Vector3(targetX, 0, targetZ); }
    attempts++;
  }
  return hit || new THREE.Vector3(0, 0, 0);
};

const MIDI_MODULES = import.meta.glob('/src/assets/midi/*.mid', { eager: true, query: '?url', import: 'default' });
const SONG_LIST = Object.keys(MIDI_MODULES).map((path) => ({ name: decodeURIComponent(path.split('/').pop().replace('.mid', '')), url: MIDI_MODULES[path] }));

const computeLayout = (tracks) => {
  if (!tracks || tracks.length === 0) return { rows: [], settings: [] };
  const rows = []; let rem = tracks.length, cap = 3; while (rem > 0) { const c = Math.min(rem, cap); rows.push(c); rem -= c; cap += 2; }
  const settings = []; let trackIdx = 0;
  rows.forEach((count, r) => {
    const gap = count > 1 ? CONFIG.CAT_ARC / (count - 1) : 0;
    const rad = CONFIG.FIRST_ROW_RADIUS + r * CONFIG.ROW_Z_GAP;
    const y = (r + 1) * CONFIG.HEIGHT_STEP; 
    for (let i = 0; i < count; i++) {
      const th = (i - (count - 1) / 2) * gap + Math.PI / 2;
      settings.push({ position: [Math.cos(th) * rad, y, Math.sin(th) * rad], rotation: [0, -th - Math.PI / 2, 0], color: tracks[trackIdx]?.info?.color || '#ffffff', notes: tracks[trackIdx]?.notes || [] });
      trackIdx++;
    }
  });
  return { rows, settings };
};

export default function App() {
  window.Tone = Tone; // ControlPanel에서 슬라이더 조작 시 Tone에 접근할 수 있도록 노출

  const [playback, setPlayback] = useState({ isPlaying: false, current: 0, duration: 0 });
  const [parsedTracks, setParsedTracks] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(SONG_LIST[0]?.url || '');
  const [showUI, setShowUI] = useState(true);

  const synths = useRef([]);
  const parts = useRef([]);

  const { rows, settings: layoutSettings } = useMemo(() => computeLayout(parsedTracks), [parsedTracks]);
  const currentPage = Math.min(Math.floor((playback.duration ? playback.current / playback.duration : 0) * 10), 9);

  const archPlacements = useMemo(() => [
    { x: -28, z: 18, rot: Math.PI / 4, s: 1001 }, 
    { x: 32, z: -12, rot: -Math.PI / 6, s: 1002 },
    { x: 15, z: 40, rot: Math.PI / 1.1, s: 1003 }
  ].map(d => ({ pos: getSurfacePoint(false, d.x, d.z, d.s), rot: d.rot })), []);

  const singlePillars = useMemo(() => [
    { x: -38, z: -22, rot: [0, 0, 0], s: 2001 },
    { x: 35, z: 28, rot: [0, 0.5, 0], s: 2002 }
  ].map(d => ({ pos: getSurfacePoint(false, d.x, d.z, d.s), rot: d.rot })), []);

  const handleGrassSetup = useCallback((d, i) => {
    const hitPoint = getSurfacePoint(true, null, null, i + 5000);
    d.position.copy(hitPoint); 
    const scaleBase = 0.5 + getSeededRandom(i, 0, 0, 10) * 0.8;
    d.scale.set(scaleBase, scaleBase * (1.0 + getSeededRandom(i, 1, 1, 20) * 0.5), scaleBase);
    d.rotation.set((getSeededRandom(i, 2, 2, 30) - 0.5) * 0.4, getSeededRandom(i, 3, 3, 40) * Math.PI * 2, (getSeededRandom(i, 4, 4, 50) - 0.5) * 0.4);
  }, []);

  const handleSlabSetup = useCallback((d, i) => {
    const hitPoint = getSurfacePoint(true, null, null, i + 8000);
    d.position.set(hitPoint.x, hitPoint.y - 0.05, hitPoint.z);
    d.scale.set(0.8 + getSeededRandom(i, 5, 5, 60) * 1.2, 1, 0.8 + getSeededRandom(i, 6, 6, 70) * 1.2);
    d.rotation.set((getSeededRandom(i, 7, 7, 80) - 0.5) * 0.15, getSeededRandom(i, 8, 8, 90) * Math.PI, (getSeededRandom(i, 9, 9, 0) - 0.5) * 0.15);
  }, []);

  const handlePebbleSetup = useCallback((d, i) => {
    const hitPoint = getSurfacePoint(false, null, null, i + 9000);
    d.position.copy(hitPoint);
    d.rotation.set(getSeededRandom(i, 0, 1, 10) * 3, getSeededRandom(i, 1, 2, 20) * 3, getSeededRandom(i, 2, 3, 30) * 3);
    d.scale.setScalar(0.4 + getSeededRandom(i, 3, 4, 40) * 1.2);
  }, []);

  const loadMidi = async () => {
    if (!selectedUrl) return;
    try {
      if (playback.isPlaying) { Tone.Transport.stop(); Tone.Transport.cancel(); }
      const midi = await Midi.fromUrl(selectedUrl); 
      const rawTracks = midi.tracks.filter(t => t.notes.length > 0);
      const mappedTracks = rawTracks.map(t => ({ ...t, info: getTrackInfo(t) }));
      mappedTracks.sort((a, b) => a.info.order - b.info.order);
      const maxD = Math.max(...mappedTracks.map(t => t.notes[t.notes.length - 1]?.time + t.notes[t.notes.length - 1]?.duration || 0));
      
      setPlayback({ isPlaying: false, current: 0, duration: maxD + 1 });
      setParsedTracks(mappedTracks);
      Tone.Transport.seconds = 0;
      
      synths.current.forEach(s => s.dispose());
      parts.current.forEach(p => p.dispose());
      synths.current = mappedTracks.map(() => {
        const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } });
        return synth.toDestination();
      });
      Tone.getDestination().volume.value = -18;      
      parts.current = mappedTracks.map((track, index) => {
        const p = new Tone.Part((time, note) => {
          synths.current[index].triggerAttackRelease(note.name, note.duration, time, note.velocity * 0.7);
        }, track.notes);
        p.start(0); return p;
      });
    } catch (e) { console.error("MIDI Load Error:", e); }
  };

  const togglePlay = async () => {
    await Tone.start(); 
    if (playback.isPlaying) { 
      Tone.Transport.pause(); 
      synths.current.forEach(s => s.releaseAll()); 
    } else { 
      if (playback.current >= playback.duration) Tone.Transport.seconds = 0; 
      Tone.Transport.start(); 
    }
    setPlayback(p => ({ ...p, isPlaying: !p.isPlaying }));
  };

  useEffect(() => {
    let rafId; let lastUiUpdateTime = 0;
    if (!playback.isPlaying) return;
    const loop = (time) => {
      const curr = Tone.Transport.seconds;
      if (playback.duration > 0 && curr >= playback.duration) {
        Tone.Transport.stop(); synths.current.forEach(s => s.releaseAll());
        setPlayback(p => ({ ...p, isPlaying: false, current: 0 })); return;
      }
      if (time - lastUiUpdateTime > 100) { setPlayback(p => ({ ...p, current: curr })); lastUiUpdateTime = time; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [playback.isPlaying, playback.duration]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#e0f2f7', position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      <ControlPanel 
        showUI={showUI} setShowUI={setShowUI}
        selectedUrl={selectedUrl} setSelectedUrl={setSelectedUrl}
        songList={SONG_LIST}
        loadMidi={loadMidi} togglePlay={togglePlay}
        playback={playback} setPlayback={setPlayback}
      />

      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 30, -50], fov: 40 }} onCreated={({ gl }) => { gl.setClearColor('#e0f2f7'); }}>
        <color attach="background" args={['#e0f2f7']} />
        <fog attach="fog" args={['#e0f2f7', 65, 160]} />
        <hemisphereLight intensity={1.2} color="#ffffff" groundColor="#7a6b5a" />
        <directionalLight position={[50, 70, 20]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
        <Environment preset="park" />

        <Suspense fallback={null}>
          <FloatingIslandRocks />
          
          <InstancedGroup count={CONFIG.GRASS_COUNT} geo={GEO.grass} mat={MAT.grass} onSetup={handleGrassSetup} />
          <InstancedGroup count={CONFIG.PEBBLE_COUNT} geo={GEO.slab} mat={MAT.slab} onSetup={handleSlabSetup} />
          <InstancedGroup count={100} geo={GEO.pebble} mat={MAT.pebble} onSetup={handlePebbleSetup} />
          
          <InstancedGroup count={18} geo={GEO.cloud} mat={MAT.cloud} onSetup={(d, i) => {
            const r = 60 + getSeededRandom(i, 0, 0, 1) * 60;
            const th = getSeededRandom(i, 1, 1, 2) * Math.PI * 2;
            d.position.set(Math.cos(th) * r, 20 + getSeededRandom(i, 2, 2, 3) * 20, Math.sin(th) * r);
            d.scale.set(10, 4, 6);
          }} />

          {archPlacements.map((data, i) => (
            <RuinedArch key={`arch-${i}`} position={[data.pos.x, data.pos.y, data.pos.z]} rotation={data.rot} />
          ))}
          {singlePillars.map((data, i) => (
            <MajesticPillar key={`pil-${i}`} position={[data.pos.x, data.pos.y, data.pos.z]} rotation={data.rot} hasMoss={i % 2 === 0} />
          ))}

          <group position={[0, 0, 0]}> 
            <mesh position={[0, -1, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[26, 26, 14, 64]} />
              <meshStandardMaterial color="#d4dad4" roughness={0.8} />
            </mesh>
            <mesh position={[0, 6.25, 0]} receiveShadow castShadow><cylinderGeometry args={[25, 26, 0.5, 64]} /><meshStandardMaterial color="#dfe5df" roughness={0.7} /></mesh>
            <mesh position={[0, 6.75, 0]} receiveShadow castShadow><cylinderGeometry args={[24, 25, 0.5, 64]} /><meshStandardMaterial color="#f0f4f0" roughness={0.6} /></mesh>
            <group position={[0, 7.0, 0]}> 
              <ConductorStand currentPage={currentPage} />
              {rows.map((_, rIdx) => (
                <CurvedStage key={`st-${rIdx}`} innerRadius={(CONFIG.FIRST_ROW_RADIUS + rIdx * CONFIG.ROW_Z_GAP) - 1.6} outerRadius={(CONFIG.FIRST_ROW_RADIUS + rIdx * CONFIG.ROW_Z_GAP) + 1.6} height={(rIdx + 1) * CONFIG.HEIGHT_STEP} arcAngle={CONFIG.STAGE_ARC} />
              ))}
              {layoutSettings.map((s, i) => (
                <AnimalCharacter key={`cat-${i}`} modelUrl="/models/character.glb" position={s.position} rotation={s.rotation} notes={s.notes} auraColor={s.color} isPlaying={playback.isPlaying} />
              ))}
            </group>
          </group>

          <FloatingDebris position={[-100, -30, 50]} size={20} color="#c5b59f" />
          <FloatingDebris position={[110, -40, -70]} size={25} color="#8b7d6b" />
        </Suspense>

        <OrbitControls target={[0, 8, 0]} maxPolarAngle={Math.PI / 2.15} minDistance={25} maxDistance={110} enableDamping dampingFactor={0.03} />
      </Canvas>
    </div>
  );
}