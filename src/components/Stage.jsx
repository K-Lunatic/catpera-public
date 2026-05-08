import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MAT } from '../constants';

const generateSheetTexture = (pageNum) => {
  const canvas = document.createElement('canvas'); 
  canvas.width = canvas.height = 1024; 
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#fffff8'; 
  ctx.fillRect(0, 0, 1024, 1024); 
  ctx.fillStyle = '#d32f2f'; 
  ctx.font = 'bold 80px sans-serif'; 
  ctx.textAlign = 'center'; 
  ctx.fillText(`PAGE ${pageNum}`, 512, 120); 
  ctx.fillStyle = '#333'; 
  ctx.font = 'italic 40px serif'; 
  ctx.fillText(`Catpera Symphony`, 512, 180); 
  ctx.lineWidth = 3;
  
  for (let s = 0; s < 4; s++) {
    const startY = 280 + s * 180;
    for (let l = 0; l < 5; l++) { 
      ctx.beginPath(); 
      ctx.moveTo(100, startY + l * 15); 
      ctx.lineTo(924, startY + l * 15); 
      ctx.stroke(); 
    }
    const noteCount = 6 + ((pageNum * 5 + s) % 8);
    for (let n = 0; n < noteCount; n++) {
      const x = 150 + n * 80 + (s * 30 % 50); 
      const y = startY + ((pageNum + s + n) % 9) * 7.5; 
      ctx.beginPath(); 
      ctx.ellipse(x, y, 12, 8, -Math.PI / 6, 0, Math.PI * 2); 
      ctx.fill(); 
      ctx.beginPath(); 
      ctx.moveTo(x + 10, y); 
      ctx.lineTo(x + 10, y - 50); 
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas); 
  texture.anisotropy = 16; 
  texture.colorSpace = THREE.SRGBColorSpace; 
  return texture;
};

export const ConductorStand = ({ currentPage }) => {
  const sheets = useMemo(() => Array.from({ length: 10 }, (_, i) => generateSheetTexture(i + 1)), []);
  return (
    <group position={[0, 0, 2]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow geometry={new THREE.BoxGeometry(1.2, 0.1, 1.2)} material={MAT.standBase} />
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow geometry={new THREE.CylinderGeometry(0.06, 0.08, 1.5, 16)} material={MAT.standPole} />
      <mesh position={[0, 1.8, 0]} rotation={[-Math.PI / 6, 0, 0]} castShadow receiveShadow geometry={new THREE.BoxGeometry(2.0, 1.4, 0.05)} material={MAT.standWood} />
      <mesh position={[0, 1.8, 0.03]} rotation={[-Math.PI / 6, 0, 0]} receiveShadow>
        <planeGeometry args={[1.8, 1.2]} />
        <meshStandardMaterial map={sheets[currentPage]} emissiveMap={sheets[currentPage]} emissive="#ffffff" emissiveIntensity={0.6} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const CurvedStage = ({ innerRadius, outerRadius, height, arcAngle }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape(); 
    const c = -Math.PI / 2; 
    s.absarc(0, 0, outerRadius, c - arcAngle / 2, c + arcAngle / 2, false);
    s.lineTo(Math.cos(c + arcAngle / 2) * innerRadius, Math.sin(c + arcAngle / 2) * innerRadius);
    s.absarc(0, 0, innerRadius, c + arcAngle / 2, c - arcAngle / 2, true);
    return s;
  }, [innerRadius, outerRadius, arcAngle]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
      <meshStandardMaterial color="#cbd5cb" roughness={0.9} metalness={0.1} /> 
    </mesh>
  );
};