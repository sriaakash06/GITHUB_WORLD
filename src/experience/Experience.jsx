import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Ground } from './Ground';
import { Building } from './Building';
import { Tree } from './Tree';
import { PALETTE } from './Constants';
import gsap from 'gsap';

const Cloud = ({ position, scale }) => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
    <mesh position={position} scale={scale}>
      <boxGeometry args={[4, 1.5, 2]} />
      <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} />
    </mesh>
  </Float>
);

export const Experience = ({ repos, isCinematic, setHoveredRepo }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(60, 60, 60);
    if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
    }

    const resetCamera = () => {
      gsap.to(camera.position, {
        x: 60,
        y: 60,
        z: 60,
        duration: 1.5,
        ease: "power3.out"
      });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5
        });
      }
    };

    window.addEventListener('reset-camera', resetCamera);
    return () => window.removeEventListener('reset-camera', resetCamera);
  }, [camera]);

  const buildingPlacements = useMemo(() => {
    const spacing = 4;
    const gridDim = 10;
    return repos.slice(0, 40).map((repo, i) => {
      // Find a grid spot that isn't a road
      // Road is at x%10 == 0 or z%10 == 0
      // We'll place houses at offsets like x=5, z=5, etc.
      const gridX = (i % 6) * 10 + 5 - 30;
      const gridZ = Math.floor(i / 6) * 10 + 5 - 30;
      
      return {
        ...repo,
        position: [gridX * spacing / 4, 0, gridZ * spacing / 4],
        rotation: [0, Math.PI / i, 0]
      };
    });
  }, [repos]);

  const decorations = useMemo(() => {
    const clouds = [];
    const trees = [];
    for (let i = 0; i < 15; i++) {
        clouds.push({
            position: [Math.random() * 80 - 40, 15 + Math.random() * 10, Math.random() * 80 - 40],
            scale: 0.5 + Math.random() * 1.5
        });
    }
    for (let i = 0; i < 30; i++) {
        trees.push({
            position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50],
            scale: 0.5 + Math.random() * 1.5
        });
    }
    return { clouds, trees };
  }, []);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        maxPolarAngle={Math.PI / 2.5} 
        minDistance={20} 
        maxDistance={200} 
      />
      
      {/* Lighting */}
      <SoftShadows size={25} samples={10} focus={0} />
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      <group>
        <Ground />
        
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

        {decorations.trees.map((tree, i) => (
          <Tree key={i} position={tree.position} scale={tree.scale} />
        ))}

        {decorations.clouds.map((cloud, i) => (
          <Cloud key={i} {...cloud} />
        ))}
      </group>

      <ContactShadows 
         position={[0, -0.01, 0]} 
         opacity={0.4} 
         scale={200} 
         blur={1} 
         far={20} 
         resolution={512} 
      />
    </>
  );
};

