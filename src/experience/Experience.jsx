import React, { useMemo, useRef, useEffect, useState } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import { Building } from './Building';
import { Tree } from './Tree';
import GitVilleTownHall from './GitVilleTownHall';
import { PALETTE } from './Constants';
import { Vehicle } from './Vehicle';


const getCityLayout = (repos) => {
  const layout = [];
  const repoSlots = [];
  
  let x = 0;
  let z = 0;
  let dx = 1;
  let dz = 0;
  let segmentLength = 1;
  let segmentPassed = 0;
  let turns = 0;
  
  layout.push({ type: 'townhall', cx: 0, cz: 0 });
  
  const addSlot = (cx, cz) => {
    if (cx === 0 && cz === 0) return;
    const isRoadX = Math.abs(cx) % 3 === 2;
    const isRoadZ = Math.abs(cz) % 3 === 2;
    
    if (!isRoadX && !isRoadZ) {
      repoSlots.push({ cx, cz });
    }
  };

  while (repoSlots.length < (repos?.length || 0)) {
    if (x !== 0 || z !== 0) {
      addSlot(x, z);
    }
    x += dx;
    z += dz;
    segmentPassed++;
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      const temp = dx;
      dx = -dz;
      dz = temp;
      turns++;
      if (turns % 2 === 0) {
        segmentLength++;
      }
    }
  }
  
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
  repoSlots.forEach(slot => {
    minX = Math.min(minX, slot.cx);
    maxX = Math.max(maxX, slot.cx);
    minZ = Math.min(minZ, slot.cz);
    maxZ = Math.max(maxZ, slot.cz);
  });
  
  minX -= 1; maxX += 1;
  minZ -= 1; maxZ += 1;
  
  for (let cx = minX; cx <= maxX; cx++) {
    for (let cz = minZ; cz <= maxZ; cz++) {
      const isRoadX = Math.abs(cx) % 3 === 2;
      const isRoadZ = Math.abs(cz) % 3 === 2;
      
      if (isRoadX || isRoadZ) {
        layout.push({ type: 'road', cx, cz, isIntersection: isRoadX && isRoadZ, isRoadX, isRoadZ });
      } else {
        const isRepo = repoSlots.find(r => r.cx === cx && r.cz === cz);
        if (!isRepo && !(cx === 0 && cz === 0)) {
           layout.push({ type: 'park', cx, cz });
        }
      }
    }
  }
  
  return { layout, repoSlots };
};

// ─────────────────────────────────────────────
// CLOUD
// ─────────────────────────────────────────────
const Cloud = ({ startPos, scale = 1, speed = 0.5 }) => {
  const ref = useRef();
  const { camera } = useThree();
  
  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(...startPos);
    }
  }, [startPos]);

  useFrame((_, delta) => {
    if (ref.current && camera) {
      ref.current.position.x -= speed * delta * 5;
      if (ref.current.position.x < camera.position.x - 100) {
        ref.current.position.x = camera.position.x + 100;
        ref.current.position.z = camera.position.z + (Math.random() - 0.5) * 150;
      }
    }
  });
  return (
    <group ref={ref} scale={scale}>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.6}>
        <group>
          <mesh castShadow>
            <sphereGeometry args={[1.3, 7, 7]} />
            <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
          </mesh>
          <mesh position={[-1.1, -0.25, 0.1]} castShadow>
            <sphereGeometry args={[0.95, 7, 7]} />
            <meshStandardMaterial color="#f8f8f8" roughness={1} flatShading />
          </mesh>
          <mesh position={[1.1, -0.2, -0.15]} castShadow>
            <sphereGeometry args={[0.95, 7, 7]} />
            <meshStandardMaterial color="#f8f8f8" roughness={1} flatShading />
          </mesh>
          <mesh position={[0.45, 0.55, 0.4]} castShadow>
            <sphereGeometry args={[0.78, 6, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
          </mesh>
          <mesh position={[-0.5, 0.45, -0.35]} castShadow>
            <sphereGeometry args={[0.72, 6, 6]} />
            <meshStandardMaterial color="#efefef" roughness={1} flatShading />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

// ─────────────────────────────────────────────
// HOT AIR BALLOON
// ─────────────────────────────────────────────
const HotAirBalloon = ({ startPos, color, scale = 1, speed = 1 }) => {
  const ref = useRef();
  const { camera } = useThree();
  
  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(...startPos);
    }
  }, [startPos]);

  useFrame((_, delta) => {
    if (ref.current && camera) {
      ref.current.position.z -= speed * delta * 3;
      if (ref.current.position.z < camera.position.z - 100) {
         ref.current.position.z = camera.position.z + 100;
         ref.current.position.x = camera.position.x + (Math.random() - 0.5) * 150;
      }
    }
  });
  return (
    <group ref={ref} scale={scale}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
        <group>
          <mesh castShadow>
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.6, 0.8]} />
            <meshStandardMaterial color="#8b4513" roughness={0.9} flatShading />
          </mesh>
          {[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map(([x, z], i) => (
            <mesh key={i} position={[x, -1.5, z]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 1.6]} />
              <meshStandardMaterial color="#2d3436" flatShading />
            </mesh>
          ))}
        </group>
      </Float>
    </group>
  );
};

// ─────────────────────────────────────────────
// LAMP POST
// ─────────────────────────────────────────────
const LampPost = ({ position, isNightMode }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[0.35, 1.2, 0]} castShadow>
      <boxGeometry args={[0.7, 0.06, 0.06]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[0.7, 1.15, 0]} castShadow>
      <sphereGeometry args={[0.18, 7, 7]} />
      <meshStandardMaterial color="#fff8d0" emissive="#ffe890" emissiveIntensity={isNightMode ? 2.5 : 0.6} flatShading />
    </mesh>
    {isNightMode && <pointLight position={[0.7, 1.5, 0]} intensity={1.5} distance={15} color="#ffe890" />}
  </group>
);

const RoadCell = React.memo(({ cx, cz, isIntersection, isRoadX, isRoadZ, isNightMode }) => {
  const px = cx * 16;
  const pz = cz * 16;
  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[16, 1, 16]} />
        <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
      </mesh>
      
      {isIntersection ? (
        <group position={[0, 0.01, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
             <planeGeometry args={[16, 16]} />
             <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <circleGeometry args={[3, 32]} />
             <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <ringGeometry args={[3.2, 3.6, 32]} />
             <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <LampPost position={[6, 0.1, -6]} isNightMode={isNightMode} />
          <LampPost position={[-6, 0.1, 6]} isNightMode={isNightMode} />
        </group>
      ) : isRoadX ? (
        <group position={[0, 0.01, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
             <planeGeometry args={[8, 16]} />
             <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.2, 16]} />
             <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 0.01, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
             <planeGeometry args={[16, 8]} />
             <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[16, 0.2]} />
             <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
});

const ParkCell = React.memo(({ cx, cz, isNightMode }) => {
  const px = cx * 16;
  const pz = cz * 16;
  const seed = Math.abs(Math.sin(cx * 9301 + cz * 49297) * 233280) % 1;
  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[16, 1, 16]} />
        <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
      </mesh>
      <Tree position={[3, 0, 3]} scale={0.3 + seed * 0.2} />
      <Tree position={[-3, 0, -2]} scale={0.2 + seed * 0.3} />
      <Tree position={[2, 0, -4]} scale={0.4} />
      <Tree position={[-4, 0, 4]} scale={0.25} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[4, 16]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
      </mesh>
      {seed > 0.5 && <LampPost position={[0, 0.1, 0]} isNightMode={isNightMode} />}
    </group>
  );
});

const BuildingCell = React.memo(({ cx, cz, repo, isTownHall, onBuildingClick, onHover, onUnhover, isNightMode, isSelected, username }) => {
  const px = cx * 16;
  const pz = cz * 16;
  const seed = Math.abs(Math.sin(cx * 9301 + cz * 49297) * 233280) % 1;
  const hasTree1 = seed > 0.3;
  const hasTree2 = seed > 0.7;

  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[16, 1, 16]} />
        <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
      </mesh>
      
      {isTownHall ? (
        <GitVilleTownHall position={[0, 0, 0]} username={username} />
      ) : repo ? (
        <Building
          repo={repo}
          index={Math.abs(cx) + Math.abs(cz)}
          position={[0, 0.1, 0]}
          rotation={[0, Math.abs(cx) > Math.abs(cz) ? Math.PI / 2 : 0, 0]}
          isSelected={isSelected}
          onClick={() => onBuildingClick(repo, [px, 0.1, pz])}
          onHover={() => onHover(repo)}
          onUnhover={() => onUnhover()}
        />
      ) : null}

      {hasTree1 && <Tree position={[5.5, 0.1, 6]} scale={0.25 + seed * 0.2} />}
      {hasTree2 && <Tree position={[-5.5, 0.1, -6]} scale={0.25 + seed * 0.2} />}
    </group>
  );
});

// ─────────────────────────────────────────────
// MAIN EXPERIENCE
// ─────────────────────────────────────────────
export const Experience = ({ repos, user, isCinematic, setHoveredRepo, isNightMode }) => {
  const controlsRef = useRef();
  const { camera } = useThree();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // WASD controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = true;
      if (key === 'escape' && selectedRepo) setSelectedRepo(null);
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedRepo]);

  useFrame((state, delta) => {
    if (selectedRepo || isCinematic || !controlsRef.current) return;
    
    let speed = 40 * delta;
    if (keys.current.w || keys.current.s || keys.current.a || keys.current.d) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      const moveVec = new THREE.Vector3(0, 0, 0);
      if (keys.current.w) moveVec.addScaledVector(forward, speed);
      if (keys.current.s) moveVec.addScaledVector(forward, -speed);
      if (keys.current.a) moveVec.addScaledVector(right, -speed);
      if (keys.current.d) moveVec.addScaledVector(right, speed);
      
      controlsRef.current.target.add(moveVec);
      camera.position.add(moveVec);
    }
  });

  const handleBuildingClick = (repo, buildingPosition) => {
    setSelectedRepo(repo);
    
    // Zoom to building
    const targetCameraPos = new THREE.Vector3(
      buildingPosition[0] - 12,
      buildingPosition[1] + 15,
      buildingPosition[2] + 15
    );
    const lookAtPos = new THREE.Vector3(
      buildingPosition[0],
      buildingPosition[1] + 4,
      buildingPosition[2]
    );

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controlsRef.current.target);

    gsap.to(camera.position, {
      x: targetCameraPos.x,
      y: targetCameraPos.y,
      z: targetCameraPos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    gsap.to(controlsRef.current.target, {
      x: lookAtPos.x,
      y: lookAtPos.y,
      z: lookAtPos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });
  };

  useEffect(() => {
    camera.position.set(55, 55, 55);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 3, 0);
      controlsRef.current.update();
    }

    const onReset = () => {
      setSelectedRepo(null);
      gsap.killTweensOf(camera.position);
      if (controlsRef.current) gsap.killTweensOf(controlsRef.current.target);

      gsap.to(camera.position, { x: 55, y: 55, z: 55, duration: 1.5, ease: 'power3.out' });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, { x: 0, y: 3, z: 0, duration: 1.5, ease: 'power3.out' });
      }
    };

    window.addEventListener('reset-camera', onReset);
    return () => window.removeEventListener('reset-camera', onReset);
  }, [camera]);

  // Generate exact cells for Town Hall and Repositories
  const cells = useMemo(() => {
    const arr = [];
    const { layout, repoSlots } = getCityLayout(repos);
    
    repoSlots.forEach((slot, i) => {
      arr.push({ ...slot, type: 'building', repo: repos[i] });
    });
    
    return [...layout, ...arr];
  }, [repos]);

  const backgroundProps = useMemo(() => {
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;
    const clouds = [];
    for (let i = 0; i < 15; i++) {
      clouds.push({
        startPos: [(Math.random() - 0.5) * 200, 18 + seed(i) * 15, (Math.random() - 0.5) * 200],
        scale: 0.9 + seed(i + 10) * 1.2,
        speed: 0.5 + seed(i + 20) * 1.5,
      });
    }

    const balloons = [];
    const balloonColors = ['#ff4444', '#ffcc00', '#44aaff', '#ff77bb'];
    for (let i = 0; i < 5; i++) {
      balloons.push({
        startPos: [(Math.random() - 0.5) * 150, 12 + seed(i + 100) * 12, (Math.random() - 0.5) * 150],
        scale: 0.7 + seed(i + 200) * 0.6,
        color: balloonColors[i % balloonColors.length],
        speed: 0.5 + seed(i + 300) * 1.5,
      });
    }
    
    const vehicles = [];
    for (let i = 0; i < 12; i++) {
        vehicles.push({
            isVertical: Math.random() > 0.5,
            dir: Math.random() > 0.5 ? 1 : -1
        });
    }
    return { clouds, balloons, vehicles };
  }, []);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 3, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={12}
        maxDistance={150}
        enableDamping
        dampingFactor={0.05}
      />

      <SoftShadows size={22} samples={12} focus={0} />
      <ambientLight intensity={isNightMode ? 0.2 : 1.4} color={isNightMode ? "#8aa2d6" : "#ffd4a3"} />
      <directionalLight
        position={[40, 60, 30]}
        intensity={isNightMode ? 0.3 : 2.2}
        color={isNightMode ? "#647bb5" : "#ffedcc"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-20, 30, -20]} intensity={isNightMode ? 0.2 : 0.4} color={isNightMode ? "#314366" : "#87CEEB"} />
      <hemisphereLight skyColor={isNightMode ? "#0B1021" : "#87CEEB"} groundColor={isNightMode ? "#08101a" : "#74cf4a"} intensity={isNightMode ? 0.4 : 0.6} />

      <group onPointerUp={(e) => { 
          if (e.button !== 0) return;
          e.stopPropagation(); 
          setSelectedRepo(null); 
        }}>
        
        {/* Grass Base (covers horizon) */}
        <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color={PALETTE.grassLight} roughness={1} flatShading />
        </mesh>

        {cells.map((cell) => {
          const key = `${cell.type}-${cell.cx}-${cell.cz}`;
          if (cell.type === 'road') {
            return <RoadCell key={key} cx={cell.cx} cz={cell.cz} isIntersection={cell.isIntersection} isRoadX={cell.isRoadX} isRoadZ={cell.isRoadZ} isNightMode={isNightMode} />;
          }
          if (cell.type === 'park') {
            return <ParkCell key={key} cx={cell.cx} cz={cell.cz} isNightMode={isNightMode} />;
          }
          if (cell.type === 'building' || cell.type === 'townhall') {
            return (
              <BuildingCell
                key={key}
                cx={cell.cx}
                cz={cell.cz}
                isTownHall={cell.type === 'townhall'}
                repo={cell.repo}
                username={user?.username}
                onBuildingClick={handleBuildingClick}
                onHover={setHoveredRepo}
                onUnhover={() => setHoveredRepo(null)}
                isNightMode={isNightMode}
                isSelected={selectedRepo?.name === cell.repo?.name}
              />
            );
          }
          return null;
        })}

        {backgroundProps.clouds.map((c, i) => (
          <Cloud key={`cloud-${i}`} startPos={c.startPos} scale={c.scale} speed={c.speed} />
        ))}

        {backgroundProps.balloons.map((b, i) => (
          <HotAirBalloon key={`balloon-${i}`} startPos={b.startPos} color={b.color} scale={b.scale} speed={b.speed} />
        ))}
        
        {backgroundProps.vehicles.map((v, i) => (
          <Vehicle key={`veh-${i}`} isVertical={v.isVertical} dir={v.dir} />
        ))}
      </group>
      
      {/* Dynamic contact shadows to ground */}
      <ContactShadows
        position={[0, 0.25, 0]}
        opacity={0.28}
        scale={200}
        blur={2.5}
        far={20}
        resolution={1024}
        frames={1}
      />
    </>
  );
};
