import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from './Building';
import { Tree } from './Tree';
import { Vehicle } from './Vehicle';
import { Ground } from './Ground';

export function Experience({ repos, isCinematic }) {
  const controlsRef = useRef();
  
  React.useEffect(() => {
    const handleReset = () => {
      if (controlsRef.current) {
        gsap.to(controlsRef.current.object.position, {
          x: 50, y: 50, z: 50,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => controlsRef.current.object.lookAt(0,0,0)
        });
      }
    };
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, []);

  useFrame((state) => {
    if (isCinematic) {
      const time = state.clock.getElapsedTime() * 0.2;
      state.camera.position.x = 60 * Math.cos(time);
      state.camera.position.z = 60 * Math.sin(time);
      state.camera.lookAt(0, 0, 0);
    }
  });

  const gridSide = useMemo(() => Math.ceil(Math.sqrt(repos.length)), [repos]);
  const spacing = 4;

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0}
        enabled={!isCinematic}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      <Ground />

      {repos.map((repo, i) => {
        const x = (i % gridSide - gridSide/2) * spacing;
        const z = (Math.floor(i / gridSide) - gridSide/2) * spacing;
        return (
          <Building 
            key={repo.name} 
            repo={repo} 
            position={[x, 0, z]} 
            onHover={setHoveredRepo}
          />
        );
      })}

      {/* Random trees outside roads */}
      {useMemo(() => Array.from({ length: 40 }).map((_, i) => {
        const tx = (Math.random() - 0.5) * 45;
        const tz = (Math.random() - 0.5) * 45;
        if (Math.abs(tx) > 2 && Math.abs(tz) > 2) {
          return <Tree key={i} position={[tx, 0, tz]} />;
        }
        return null;
      }), [])}

      {/* Vehicles */}
      <Vehicle isVertical={false} />
      <Vehicle isVertical={true} />
    </>
  );
}
