import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Building } from './Building';
import { TownHall } from './TownHall';
import IslandHouse from './IslandHouse';
import { Tree } from './Tree';
import { PALETTE } from './Constants';
import gsap from 'gsap';

// Cute puffy cloud using overlapping spheres
const Cloud = ({ position, scale }) => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position} scale={scale}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[-1, -0.2, 0.2]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[1, -0.2, -0.2]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[0.5, 0.4, 0.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[-0.5, 0.3, -0.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} transparent opacity={0.8} flatShading />
        </mesh>
      </group>
    </Float>
  );
};

// Procedural Paths for the village
const VillagePaths = ({ rings }) => {
  const paths = [];
  // Central plaza patch
  paths.push(
    <mesh key="plaza" rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <circleGeometry args={[8, 32]} />
      <meshStandardMaterial color="#c4a868" flatShading />
    </mesh>
  );

  for (let r = 1; r <= rings; r++) {
    const radius = r * 14;
    // Circular ring paths
    paths.push(
      <mesh key={`ring-${r}`} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[radius - 1, radius + 1, 64]} />
        <meshStandardMaterial color="#c4a868" flatShading />
      </mesh>
    );
  }

  // Cross paths
  const crossWidth = 2;
  const maxRadius = rings * 14;
  paths.push(
    <mesh key="cross-x" rotation={[-Math.PI/2, 0, 0]} position={[0, 0.011, 0]} receiveShadow>
      <planeGeometry args={[maxRadius * 2, crossWidth]} />
      <meshStandardMaterial color="#c4a868" flatShading />
    </mesh>
  );
  paths.push(
    <mesh key="cross-z" rotation={[-Math.PI/2, 0, Math.PI/2]} position={[0, 0.011, 0]} receiveShadow>
      <planeGeometry args={[maxRadius * 2, crossWidth]} />
      <meshStandardMaterial color="#c4a868" flatShading />
    </mesh>
  );

  return <group>{paths}</group>;
};

export const Experience = ({ repos, isCinematic, setHoveredRepo }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(40, 40, 40);
    if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
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
  }, [camera]);

  const buildingPlacements = useMemo(() => {
    return repos.slice(0, 50).map((repo, i) => {
      // Village layout: Rings around Town Hall
      const ring = Math.floor(i / 10) + 1;
      const angle = (i % 10) / 10 * Math.PI * 2;
      const radius = ring * 14; // increased spacing so they fit beautifully
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      return {
        ...repo,
        position: [x, 0, z],
        rotation: [0, -angle + Math.PI / 2, 0]
      };
    });
  }, [repos]);

  const villageAssets = useMemo(() => {
    const trees = [];
    for (let i = 0; i < 40; i++) {
        // Place trees outside the main rings or between houses
        const radius = 25 + Math.random() * 35;
        const angle = Math.random() * Math.PI * 2;
        trees.push({
            position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
            scale: 0.5 + Math.random()
        });
    }
    return { trees };
  }, []);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        maxPolarAngle={Math.PI / 2.2} 
        minDistance={10} 
        maxDistance={120} 
      />
      
      <SoftShadows size={20} samples={10} focus={0} />
      <ambientLight intensity={1} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      <group>
        {/* GRASS PLANE */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[150, 150]} />
            <meshStandardMaterial color={PALETTE.grass[0]} />
        </mesh>

        {/* VILLAGE PATHS */}
        <VillagePaths rings={Math.ceil(repos.length / 10)} />

        {/* TOWN HALL */}
        <IslandHouse position={[0, -0.4, 0]} scale={2.5} />

        {/* REPOSITORY HOUSES */}
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

        {villageAssets.trees.map((tree, i) => (
          <Tree key={i} position={tree.position} scale={tree.scale} />
        ))}
        
        {Array.from({length: 8}).map((_, i) => (
             <Cloud key={i} position={[Math.random()*100-50, 20+Math.random()*5, Math.random()*100-50]} scale={0.8+Math.random()} />
        ))}
      </group>

      <ContactShadows 
         position={[0, -0.01, 0]} 
         opacity={0.3} 
         scale={150} 
         blur={2} 
         far={15} 
         resolution={1024} 
      />
    </>
  );
};




