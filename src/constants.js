import * as THREE from 'three';

export const CONFIG = {
  STAGE_ARC: 110 * (Math.PI / 180), 
  CAT_ARC: 80 * (Math.PI / 180),   
  ROW_Z_GAP: 2.6,                   
  FIRST_ROW_RADIUS: 9.0,            
  HEIGHT_STEP: 0.7,                 
  GRASS_COUNT: 2000,                
  PEBBLE_COUNT: 30,                  
  PILLAR_THICKNESS: 2.8, 
};

/**
 * 결정론적 랜덤 함수 (Seeded Random)
 * 입력값이 같으면 항상 동일한 0~1 사이의 숫자를 반환합니다.
 */
export const getSeededRandom = (x, y, z, offset = 0) => {
  const seed = Math.sin(x * 12.9898 + y * 78.233 + z * 43.123 + offset) * 43758.5453;
  return seed - Math.floor(seed);
};

export const ISLAND_ROCKS = [
  { pos: [0, -10.5, 0], scale: [55, 10, 55], rot: [0, 0, 0] },         
  { pos: [25, -12.5, -15], scale: [40, 12, 35], rot: [0.1, 1.2, 0.1] }, 
  { pos: [-30, -12.5, 10], scale: [35, 12, 45], rot: [-0.1, 0.5, 0.3] },
  { pos: [10, -14.5, 30], scale: [30, 14, 30], rot: [0.6, 2.1, -0.4] }, 
];

export const UI_STYLES = {
  panel: { position: 'absolute', bottom: 0, left: 0, width: '100vw', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(12px)', padding: '20px 40px', boxSizing: 'border-box', borderTop: '1px solid rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)' },
  btn: { padding: '8px 16px', background: 'rgba(0,0,0,0.05)', color: '#333', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', letterSpacing: '0.5px', fontWeight: '500' },
  select: { flex: 1, padding: '10px', background: 'rgba(255,255,255,0.7)', color: '#333', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', outline: 'none', fontWeight: '500' }
};

export const GEO = {
  slab: new THREE.CylinderGeometry(2, 2, 0.15, 6), 
  pillar: new THREE.CylinderGeometry(CONFIG.PILLAR_THICKNESS * 0.8, CONFIG.PILLAR_THICKNESS, 22, 16).translate(0, 11, 0),
  pillarBase: new THREE.BoxGeometry(6.5, 1.5, 6.5).translate(0, 0.75, 0),
  pillarTop: new THREE.BoxGeometry(6.5, 1.0, 6.5).translate(0, 22.5, 0),
  beam: new THREE.BoxGeometry(18, 1.8, 3.5),
  pebble: new THREE.DodecahedronGeometry(0.15, 0),
  grass: new THREE.PlaneGeometry(0.35, 1.5).translate(0, 0.75, 0),
  cloud: new THREE.DodecahedronGeometry(1, 0),
};

export const MAT = {
  slab: new THREE.MeshStandardMaterial({ color: '#f0f4f0', roughness: 0.9 }), 
  pillar: new THREE.MeshStandardMaterial({ color: '#e0e5e0', roughness: 0.3, metalness: 0.2 }), 
  grass: new THREE.MeshStandardMaterial({ color: '#7cb37c', side: THREE.DoubleSide, alphaTest: 0.5 }), 
  pebble: new THREE.MeshStandardMaterial({ color: '#889988', roughness: 0.9 }),
  cloud: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, transparent: true, opacity: 0.9 }),
  standBase: new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.2 }),
  standPole: new THREE.MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.3, metalness: 0.6 }),
  standWood: new THREE.MeshStandardMaterial({ color: '#d2b48c', roughness: 0.6 }),
  islandGrassTop: new THREE.MeshStandardMaterial({ color: '#b8d4b8', flatShading: true, roughness: 1 }), 
  islandRockSide: new THREE.MeshStandardMaterial({ color: '#c5b59f', flatShading: true, roughness: 1 }), 
  moss: new THREE.MeshStandardMaterial({ color: '#a8c6a8', side: THREE.DoubleSide, alphaTest: 0.5, flatShading: true }), 
};

export const formatTime = (t) => isNaN(t) ? "00:00" : `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

export const getTrackInfo = (track) => {
  if (track.isPercussion) return { color: '#f75b4f', order: 3 }; 
  const family = (track.instrument?.family || '').toLowerCase();
  if (['piano', 'string', 'guitar', 'ensemble'].some(k => family.includes(k))) return { color: '#4facf7', order: 1 };
  if (['brass', 'reed', 'pipe', 'wind'].some(k => family.includes(k))) return { color: '#f7d04f', order: 2 };
  if (family.includes('bass')) return { color: '#b64ff7', order: 3 };
  return { color: '#ffffff', order: 4 };
};
