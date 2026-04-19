import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, Environment, Sky, Stars, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { Ground } from './Ground';
import { Building } from './Building';
import { Tree } from './Tree';
import { Vehicle } from './Vehicle';
import { OctocatPlaceholder as Octocat } from './Octocat';
import gsap from 'gsap';

export const Experience = ({ repos, isCinematic, setHoveredRepo }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (isCinematic) {
      camera.position.set(100, 100, 100);
      gsap.to(camera.position, {
        x: 40,
        y: 40,
        z: 40,
        duration: 4,
        ease: "power2.inOut"
      });
    }

    const resetCamera = () => {
      gsap.to(camera.position, {
        x: 40,
        y: 40,
        z: 40,
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
  }, [isCinematic, camera]);

  const buildingPlacements = useMemo(() => {
    return repos.map((repo, i) => {
      // Golden spiral / Fermat's spiral for even distribution
      const angle = i * 137.5 * (Math.PI / 180);
      const radius = 6 + Math.sqrt(i) * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      return {
        ...repo,
        position: [x, 0, z],
        rotation: [0, -angle, 0]
      };
    });
  }, [repos]);

  const decoPlacements = useMemo(() => {
    const trees = [];
    const vehicles = [];
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 30;
        trees.push({
            position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
            scale: 0.5 + Math.random() * 1.5
        });
    }
    for (let i = 0; i < 8; i++) {
        vehicles.push({
            speed: 0.01 + Math.random() * 0.02,
            radius: 12 + Math.random() * 25,
            offset: Math.random() * Math.PI * 2,
            y: 0
        });
    }
    return { trees, vehicles };
  }, []);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={10} 
        maxDistance={120} 
      />
      
      {/* Lighting */}
      <SoftShadows size={25} samples={10} focus={0} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <pointLight position={[-20, 10, -20]} intensity={0.5} color="#ffaa00" />
      
      {/* Environment */}
      <Environment preset="sunset" />
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* World Elements */}
      <group>
        <Ground />
        
        {/* Central Figure */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <Octocat position={[0, 3, 0]} scale={2} />
        </Float>

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

        {decoPlacements.trees.map((tree, i) => (
          <Tree key={i} position={tree.position} scale={tree.scale} />
        ))}

        {decoPlacements.vehicles.map((v, i) => (
          <Vehicle key={i} {...v} />
        ))}
      </group>

      <ContactShadows 
         position={[0, -2.5, 0]} 
         opacity={0.4} 
         scale={100} 
         blur={2} 
         far={10} 
         resolution={512} 
      />
    </>
  );
};
