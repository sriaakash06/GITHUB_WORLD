import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Building } from './Building';
import { StylizedHouse } from './StylizedHouse';
import { Tree } from './Tree';
import { PALETTE } from './Constants';
import gsap from 'gsap';

const Cloud = ({ position, scale }) => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
    <mesh position={position} scale={scale}>
      <boxGeometry args={[4, 1.5, 2]} />
      <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.6} />
    </mesh>
  </Float>
);

export const Experience = ({ repos, isCinematic, setHoveredRepo }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(30, 30, 30);
    if (controlsRef.current) {
        controlsRef.current.target.set(0, 2, 0);
    }

    const resetCamera = () => {
      gsap.to(camera.position, {
        x: 30,
        y: 30,
        z: 30,
        duration: 1.5,
        ease: "power3.out"
      });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 2,
          z: 0,
          duration: 1.5
        });
      }
    };

    window.addEventListener('reset-camera', resetCamera);
    return () => window.removeEventListener('reset-camera', resetCamera);
  }, [camera]);

  const buildingPlacements = useMemo(() => {
    return repos.slice(0, 40).map((repo, i) => {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 25 + Math.random() * 10;
      const gridX = Math.cos(angle) * radius;
      const gridZ = Math.sin(angle) * radius;
      
      return {
        ...repo,
        position: [gridX, 0, gridZ],
        rotation: [0, -angle, 0]
      };
    });
  }, [repos]);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        maxPolarAngle={Math.PI / 2.2} 
        minDistance={5} 
        maxDistance={100} 
      />
      
      {/* Soft, Stylized Lighting */}
      <SoftShadows size={15} samples={10} focus={0} />
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      <group>
        {/* THE STYLIZED HOUSE DIORAMA */}
        <StylizedHouse position={[0, 0, 0]} scale={1.2} />

        {buildingPlacements.map((repo, i) => (
          <Building 
            key={repo.name} 
            repo={repo} 
            position={repo.position} 
            rotation={repo.rotation}
            onHover={() => setHoveredRepo(repo)}
            onUnhover={() => setHoveredRepo(null)}
          />
        ))}

        {buildingPlacements.length > 0 && Array.from({length: 10}).map((_, i) => (
             <Cloud key={i} position={[Math.random()*60-30, 15+Math.random()*5, Math.random()*60-30]} scale={0.5+Math.random()} />
        ))}
      </group>

      <ContactShadows 
         position={[0, -0.01, 0]} 
         opacity={0.4} 
         scale={100} 
         blur={2.5} 
         far={10} 
         resolution={1024} 
      />
    </>
  );
};



