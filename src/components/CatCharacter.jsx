import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import * as Tone from 'tone';

export const AnimalCharacter = ({ modelUrl, position, rotation, notes, auraColor, isPlaying }) => {
  const { scene, animations } = useGLTF(modelUrl);
  
  const clone = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(scene);
    clonedScene.traverse((node) => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.frustumCulled = false; 
        node.castShadow = true;
      }
    });
    return clonedScene;
  }, [scene]);
  
  const { actions, names } = useAnimations(animations, clone);
  const lightRef = useRef();
  const noteCursor = useRef(0);

  useEffect(() => {
    if (!actions || names.length === 0) return;

    const breathName = names.find(n => n.toLowerCase().includes('breath') || n.toLowerCase().includes('idle')) || names[0];
    const singName = names.find(n => n.toLowerCase().includes('sing')) || (names.length > 1 ? names[1] : names[0]);

    const idleAction = actions[breathName];
    const singAction = actions[singName];

    if (idleAction) {
      idleAction.reset().play();
      idleAction.setEffectiveWeight(1); 
    }
    if (singAction && singAction !== idleAction) {
      singAction.reset().play();
      singAction.setEffectiveWeight(0); 
    }
  }, [actions, names, isPlaying]);

  useFrame((_, delta) => {
    if (!actions || names.length === 0) return;

    const curr = Tone.Transport.seconds;
    let isActive = false;

    if (isPlaying && notes && notes.length > 0) {
      if (noteCursor.current > 0 && curr < notes[noteCursor.current - 1]?.time) {
        noteCursor.current = 0;
      }
      while (noteCursor.current < notes.length && curr > notes[noteCursor.current].time + notes[noteCursor.current].duration + 0.2) {
        noteCursor.current++;
      }
      for (let i = noteCursor.current; i < Math.min(notes.length, noteCursor.current + 5); i++) {
        if (curr >= notes[i].time && curr <= notes[i].time + notes[i].duration + 0.2) {
          isActive = true;
          break;
        }
      }
    }
    
    const breathName = names.find(n => n.toLowerCase().includes('breath') || n.toLowerCase().includes('idle')) || names[0];
    const singName = names.find(n => n.toLowerCase().includes('sing')) || (names.length > 1 ? names[1] : names[0]);

    const idleAction = actions[breathName];
    const singAction = actions[singName];
    const lerpSpeed = 10 * delta;

    if (singAction && singAction !== idleAction) {
      const currentSingWeight = singAction.getEffectiveWeight();
      const targetSingWeight = isActive ? 1 : 0;
      singAction.setEffectiveWeight(THREE.MathUtils.lerp(currentSingWeight, targetSingWeight, lerpSpeed));
    }
    
    if (idleAction) {
      const currentIdleWeight = idleAction.getEffectiveWeight();
      const targetIdleWeight = isActive ? 0 : 1;
      idleAction.setEffectiveWeight(THREE.MathUtils.lerp(currentIdleWeight, targetIdleWeight, lerpSpeed));
    }

    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, isActive ? 2.0 : 0.1, lerpSpeed);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <pointLight ref={lightRef} color={auraColor} distance={3} decay={2} intensity={0.1} position={[0, 0.5, 0]} />
      <primitive object={clone} />
    </group>
  );
};