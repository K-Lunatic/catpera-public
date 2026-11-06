import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GEO, MAT, ISLAND_ROCKS, getSeededRandom } from '../constants';

export const InstancedGroup = ({ count, geo, mat, onSetup }) => {
  const meshRef = useRef();
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      onSetup(dummy, i);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, geo, mat, onSetup]); 
  return <instancedMesh ref={meshRef} args={[geo, mat, count]} castShadow receiveShadow />;
};

export const MajesticPillar = ({ position, rotation, hasMoss = false }) => (
  <group position={position} rotation={rotation}>
    <mesh geometry={GEO.pillarBase} material={MAT.pillar} castShadow receiveShadow />
    <mesh geometry={GEO.pillar} material={MAT.pillar} castShadow receiveShadow />
    <mesh geometry={GEO.pillarTop} material={MAT.pillar} castShadow receiveShadow />
    {hasMoss && (
      <mesh position={[2, 10, 2]} scale={[2.5, 6, 2.5]} geometry={GEO.pebble} material={MAT.moss} />
    )}
  </group>
);

export const RuinedArch = ({ position, rotation }) => {
  const { tilt, beamRotation } = useMemo(() => {
    // position을 시드로 사용하여 아치의 미세한 회전값도 고정
    const r1 = getSeededRandom(position[0], position[1], position[2], 100);
    const r2 = getSeededRandom(position[2], position[0], position[1], 200);
    return {
      tilt: (r1 - 0.5) * 0.1,
      beamRotation: (r2 - 0.5) * 0.05
    };
  }, [position]);

  return (
    <group position={position} rotation={[tilt, rotation, tilt * 0.5]}>
      <MajesticPillar position={[-6.5, 0, 0]} rotation={[0,0,0]} hasMoss={true} />
      <MajesticPillar position={[6.5, 0, 0]} rotation={[0,0,0]} />
      <mesh position={[0, 23.5, 0]} rotation={[0, 0, beamRotation]} geometry={GEO.beam} material={MAT.pillar} castShadow />
      <mesh position={[-3, 24, 1.5]} scale={[4, 1.5, 2.5]} geometry={GEO.pebble} material={MAT.moss} />
    </group>
  );
};

const EDGE_GEO = new THREE.DodecahedronGeometry(2, 0);
const EDGE_MAT = new THREE.MeshStandardMaterial({ color: '#c5b59f', flatShading: true });

export const FloatingIslandRocks = () => {
  return (
    <group position={[0, 0, 0]}>
      {ISLAND_ROCKS.map((r, i) => (
        <group key={i} position={r.pos} rotation={r.rot}>
          <mesh scale={r.scale} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 0]} /> 
            <meshStandardMaterial color={MAT.islandRockSide.color} flatShading={true} roughness={1} />
          </mesh>
          <mesh position={[0, r.scale[1] * 0.08, 0]} scale={[r.scale[0]*0.98, r.scale[1]*0.98, r.scale[2]*0.98]} receiveShadow>
            <icosahedronGeometry args={[1, 0]} /> 
            <meshStandardMaterial color={MAT.islandGrassTop.color} flatShading={true} roughness={1} />
          </mesh>
        </group>
      ))}

      {/*섬 주변 돌(파편) 시드 고정 배치 */}
      <InstancedGroup 
        count={30} geo={EDGE_GEO} mat={EDGE_MAT} 
        onSetup={(d, i) => {
          const th = getSeededRandom(i, 0, 0, 10) * Math.PI * 2;
          const r = 52 + getSeededRandom(i, 1, 1, 20) * 8; 
          d.position.set(Math.cos(th) * r, -2 - getSeededRandom(i, 2, 2, 30) * 5, Math.sin(th) * r);
          d.rotation.set(getSeededRandom(i, 3, 3, 40) * 5, getSeededRandom(i, 4, 4, 50) * 5, getSeededRandom(i, 5, 5, 60) * 5);
          d.scale.setScalar(0.8 + getSeededRandom(i, 6, 6, 70));
        }}
      />
    </group>
  );
};

export const FloatingDebris = ({ position, size, color }) => {
  const rot = useMemo(() => {
    const r1 = getSeededRandom(position[0], position[1], position[2], 0.1);
    const r2 = getSeededRandom(position[0], position[1], position[2], 0.2);
    return [r1 * Math.PI * 2, r2 * Math.PI * 2, 0];
  }, [position]);

  return (
    <mesh position={position} rotation={rot} scale={[1, 0.7, 1.3]}>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} flatShading={true} roughness={1} />
    </mesh>
  );
};
