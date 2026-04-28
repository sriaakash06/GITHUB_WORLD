import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, SoftShadows, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Tree } from './Tree';
import { PALETTE, GET_STYLIZED_COLOR_FOR_LANG } from './Constants';

// ── Reusable prism roof ──────────────────────────────────────────
const PrismRoof = ({ width, depth, height, color, position }) => {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    const g = new THREE.ExtrudeGeometry(shape, { steps: 1, depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  }, [width, depth, height]);
  return (
    <mesh position={position} castShadow geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
};

// ── Street House ─────────────────────────────────────────────────
const WALL_COLORS = ['#fffbf0', '#fff5d6', '#f0fff4', '#fff0f5', '#f5f0ff', '#f0f8ff'];
const ROOF_COLS   = ['#ff8822','#44aaff','#ff4444','#ffcc00','#ff77bb','#55cc66','#b866ff','#22ccaa'];

const StreetHouse = ({ position, rotation, roofColor, wallColor, scale = 1, onHover, onUnhover }) => {
  const W = 4.5, H = 2.8, D = 3.8;
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = (groupRef.current.userData.hovered) ? scale * 1.15 : scale;
    const cur = groupRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(delta * 10, 1);
    groupRef.current.scale.set(next, next, next);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ hovered: false }}
      onPointerOver={(e) => {
        e.stopPropagation();
        groupRef.current.userData.hovered = true;
        document.body.style.cursor = 'pointer';
        onHover && onHover();
      }}
      onPointerOut={() => {
        groupRef.current.userData.hovered = false;
        document.body.style.cursor = 'default';
        onUnhover && onUnhover();
      }}
    >
      {/* Foundation */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.4, 0.24, D + 0.4]} />
        <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, H / 2 + 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={0.85} />
      </mesh>
      {/* Roof */}
      <PrismRoof width={W + 0.6} depth={D + 0.4} height={2.2} color={roofColor} position={[0, H + 0.24, 0]} />
      {/* Ridge cap */}
      <mesh position={[0, H + 0.24 + 2.15, 0]} castShadow>
        <boxGeometry args={[0.3, 0.18, D + 0.5]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.8, D / 2 + 0.05]} castShadow>
        <boxGeometry args={[0.9, 1.55, 0.09]} />
        <meshStandardMaterial color={PALETTE.door} flatShading />
      </mesh>
      {/* Door knob */}
      <mesh position={[0.28, 0.78, D / 2 + 0.11]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Front windows */}
      {[-1.35, 1.35].map((x, i) => (
        <group key={i} position={[x, 1.9, D / 2 + 0.06]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.85, 0.09]} />
            <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
          </mesh>
          <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.07, 0.9, 0.07]} /><meshStandardMaterial color="#fff" flatShading /></mesh>
          <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.85, 0.07, 0.07]} /><meshStandardMaterial color="#fff" flatShading /></mesh>
        </group>
      ))}
      {/* Chimney */}
      <mesh position={[1.1, H + 0.24 + 1.7, -0.7]} castShadow>
        <boxGeometry args={[0.38, 1.2, 0.38]} />
        <meshStandardMaterial color={PALETTE.chimney} flatShading roughness={0.9} />
      </mesh>
      <mesh position={[1.1, H + 0.24 + 2.35, -0.7]}>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshStandardMaterial color="#7a6860" flatShading />
      </mesh>
      {/* Garden grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, D / 2 + 1.6]} receiveShadow>
        <planeGeometry args={[W, 3.2]} />
        <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
      </mesh>
      {/* Picket fence posts */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-W / 2 + 0.4 + i * 0.85, 0.38, D / 2 + 3.1]} castShadow>
          <boxGeometry args={[0.1, 0.75, 0.1]} />
          <meshStandardMaterial color="white" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.24, D / 2 + 3.1]}><boxGeometry args={[W - 0.2, 0.07, 0.07]} /><meshStandardMaterial color="white" flatShading /></mesh>
      <mesh position={[0, 0.46, D / 2 + 3.1]}><boxGeometry args={[W - 0.2, 0.07, 0.07]} /><meshStandardMaterial color="white" flatShading /></mesh>
      {/* Mailbox */}
      <group position={[W / 2 - 0.4, 0.55, D / 2 + 2.6]}>
        <mesh castShadow><boxGeometry args={[0.3, 0.28, 0.42]} /><meshStandardMaterial color={roofColor} flatShading /></mesh>
        <mesh position={[0, -0.32, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.64, 6]} /><meshStandardMaterial color="#888" flatShading /></mesh>
      </group>
    </group>
  );
};

// ── Vintage Street Lamp ──────────────────────────────────────────
const VintageStreetLamp = ({ position }) => (
  <group position={position}>
    <mesh castShadow><cylinderGeometry args={[0.07, 0.11, 5.5, 7]} /><meshStandardMaterial color="#3d3d52" roughness={0.4} metalness={0.5} flatShading /></mesh>
    <mesh position={[0.55, 2.2, 0]} rotation={[0, 0, -0.28]} castShadow>
      <cylinderGeometry args={[0.046, 0.046, 1.3, 6]} />
      <meshStandardMaterial color="#3d3d52" roughness={0.4} metalness={0.5} flatShading />
    </mesh>
    <mesh position={[1.1, 2.62, 0]} castShadow>
      <cylinderGeometry args={[0.23, 0.19, 0.48, 8]} />
      <meshStandardMaterial color="#3d3d52" roughness={0.4} metalness={0.5} flatShading />
    </mesh>
    <mesh position={[1.1, 2.42, 0]}>
      <sphereGeometry args={[0.16, 8, 8]} />
      <meshStandardMaterial color="#fff8d0" emissive="#ffe060" emissiveIntensity={1.8} flatShading />
    </mesh>
    <pointLight position={[1.1, 2.42, 0]} color="#ffcc44" intensity={1.5} distance={9} decay={2} />
    <mesh position={[1.1, 2.95, 0]}><coneGeometry args={[0.28, 0.22, 8]} /><meshStandardMaterial color="#3d3d52" flatShading /></mesh>
    <mesh position={[0, -2.72, 0]} castShadow><cylinderGeometry args={[0.19, 0.23, 0.16, 8]} /><meshStandardMaterial color="#3d3d52" roughness={0.4} metalness={0.5} flatShading /></mesh>
  </group>
);

// ── Simple Person Figure ─────────────────────────────────────────
const Person = ({ position, shirtColor = '#e63946', pantsColor = '#457b9d', scale = 1 }) => (
  <group position={position} scale={scale}>
    {/* Legs */}
    {[-0.1, 0.1].map((x, i) => (
      <mesh key={i} position={[x, 0.42, 0]} castShadow>
        <boxGeometry args={[0.14, 0.85, 0.14]} />
        <meshStandardMaterial color={pantsColor} flatShading roughness={0.9} />
      </mesh>
    ))}
    {/* Body */}
    <mesh position={[0, 1.1, 0]} castShadow>
      <boxGeometry args={[0.42, 0.65, 0.28]} />
      <meshStandardMaterial color={shirtColor} flatShading roughness={0.9} />
    </mesh>
    {/* Arms */}
    {[-0.28, 0.28].map((x, i) => (
      <mesh key={i} position={[x, 1.07, 0]} castShadow>
        <boxGeometry args={[0.13, 0.6, 0.14]} />
        <meshStandardMaterial color={shirtColor} flatShading roughness={0.9} />
      </mesh>
    ))}
    {/* Head */}
    <mesh position={[0, 1.6, 0]} castShadow>
      <boxGeometry args={[0.34, 0.34, 0.3]} />
      <meshStandardMaterial color="#f5c5a3" flatShading roughness={0.8} />
    </mesh>
    {/* Hair */}
    <mesh position={[0, 1.79, -0.02]} castShadow>
      <boxGeometry args={[0.36, 0.14, 0.32]} />
      <meshStandardMaterial color="#3d2010" flatShading roughness={0.9} />
    </mesh>
  </group>
);

// ── Animated Car ─────────────────────────────────────────────────
const AnimatedCar = ({ color = '#e63946', length = 130 }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 8.5) % (length + 30);
    ref.current.position.z = -length + 15 + t;
  });
  return (
    <group ref={ref} position={[1.6, 0, -115]}>
      {/* Body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[2.1, 0.72, 4.2]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} flatShading />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.98, 0.3]} castShadow>
        <boxGeometry args={[1.85, 0.65, 2.5]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} flatShading />
      </mesh>
      {/* Windshields */}
      <mesh position={[0, 0.95, 1.56]} castShadow>
        <boxGeometry args={[1.75, 0.55, 0.07]} />
        <meshStandardMaterial color={PALETTE.window} roughness={0.05} metalness={0.3} flatShading transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.95, -0.96]} castShadow>
        <boxGeometry args={[1.75, 0.55, 0.07]} />
        <meshStandardMaterial color={PALETTE.window} roughness={0.05} metalness={0.3} flatShading transparent opacity={0.8} />
      </mesh>
      {/* Wheels */}
      {[[-0.9, -0.9], [-0.9, 0.95], [0.9, -0.9], [0.9, 0.95]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.24, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
          <meshStandardMaterial color="#222" flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* Wheel hubs */}
      {[[-0.9, -0.9], [-0.9, 0.95], [0.9, -0.9], [0.9, 0.95]].map(([x, z], i) => (
        <mesh key={i} position={[x + (x > 0 ? 0.12 : -0.12), 0.24, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.06, 8]} />
          <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.2} flatShading />
        </mesh>
      ))}
      {/* Headlights */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 2.12]}>
          <sphereGeometry args={[0.16, 7, 7]} />
          <meshStandardMaterial color="#fffde0" emissive="#fff5a0" emissiveIntensity={1.2} flatShading />
        </mesh>
      ))}
      {/* Taillights */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.42, -2.12]}>
          <sphereGeometry args={[0.13, 6, 6]} />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ── Road + Sidewalks ─────────────────────────────────────────────
const Road = ({ length = 130 }) => {
  const CZ = -length / 2 + 15;
  return (
    <group>
      {/* Grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, CZ]} receiveShadow>
        <planeGeometry args={[60, length + 40]} />
        <meshStandardMaterial color={PALETTE.grass[0]} roughness={0.95} flatShading />
      </mesh>
      {/* Asphalt road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, CZ]} receiveShadow>
        <planeGeometry args={[8.5, length + 40]} />
        <meshStandardMaterial color="#7a8898" roughness={0.95} flatShading />
      </mesh>
      {/* Left sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.2, 0.04, CZ]} receiveShadow>
        <planeGeometry args={[3.4, length + 40]} />
        <meshStandardMaterial color="#b2becd" roughness={0.92} flatShading />
      </mesh>
      {/* Right sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.2, 0.04, CZ]} receiveShadow>
        <planeGeometry args={[3.4, length + 40]} />
        <meshStandardMaterial color="#b2becd" roughness={0.92} flatShading />
      </mesh>
      {/* Curbs */}
      {[-4.25, 4.25].map((x, i) => (
        <mesh key={i} position={[x, 0.06, CZ]} receiveShadow>
          <boxGeometry args={[0.18, 0.1, length + 40]} />
          <meshStandardMaterial color="#94a3b8" flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* Center dashes */}
      {Array.from({ length: Math.floor((length + 40) / 6) }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 25 - i * 6]} receiveShadow>
          <planeGeometry args={[0.18, 3]} />
          <meshStandardMaterial color="#f0e04a" roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* Road edge lines */}
      {[-3.8, 3.8].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, CZ]} receiveShadow>
          <planeGeometry args={[0.12, length + 40]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ── Cloud ────────────────────────────────────────────────────────
const StreetCloud = ({ position, scale = 1 }) => (
  <Float speed={0.8} floatIntensity={0.5} rotationIntensity={0.05}>
    <group position={position} scale={scale}>
      <mesh><sphereGeometry args={[1.4, 7, 7]} /><meshStandardMaterial color="#fff" roughness={1} flatShading /></mesh>
      <mesh position={[-1.2, -0.3, 0.1]}><sphereGeometry args={[1.0, 7, 7]} /><meshStandardMaterial color="#f8f8f8" roughness={1} flatShading /></mesh>
      <mesh position={[1.2, -0.25, -0.1]}><sphereGeometry args={[1.0, 7, 7]} /><meshStandardMaterial color="#f8f8f8" roughness={1} flatShading /></mesh>
      <mesh position={[0.5, 0.6, 0.3]}><sphereGeometry args={[0.8, 6, 6]} /><meshStandardMaterial color="#fff" roughness={1} flatShading /></mesh>
      <mesh position={[-0.5, 0.5, -0.3]}><sphereGeometry args={[0.72, 6, 6]} /><meshStandardMaterial color="#efefef" roughness={1} flatShading /></mesh>
    </group>
  </Float>
);

const people = [
  { position: [-5.5, 0, -8],  shirtColor: '#e63946', pantsColor: '#457b9d', scale: 0.95 },
  { position: [ 5.8, 0, -18], shirtColor: '#2a9d8f', pantsColor: '#264653', scale: 1.0  },
  { position: [-5.3, 0, -30], shirtColor: '#f4a261', pantsColor: '#6d4c41', scale: 0.9  },
  { position: [ 5.5, 0, -44], shirtColor: '#9c27b0', pantsColor: '#37474f', scale: 1.05 },
  { position: [-5.6, 0, -56], shirtColor: '#1565c0', pantsColor: '#33691e', scale: 0.92 },
];

const clouds = [
  { position: [-18, 16, -20], scale: 1.2 },
  { position: [ 20, 20, -35], scale: 0.9 },
  { position: [-10, 22, -55], scale: 1.5 },
  { position: [ 15, 18, -70], scale: 1.0 },
  { position: [  5, 24, -10], scale: 0.8 },
];

// ── Main StreetScene export ──────────────────────────────────────
export const StreetScene = ({ repos = [], setHoveredRepo }) => {
  const { camera } = useThree();
  const controlsRef = useRef();

  // Generate street elements based on repos
  const { streetLength, streetHouses, streetTrees, streetLamps } = useMemo(() => {
    // If no repos, fallback to dummy data logic (e.g. 10 houses)
    const renderRepos = repos.length > 0 ? repos : Array.from({ length: 14 }).map((_, i) => ({
      name: `Dummy Repo ${i}`, language: 'JavaScript', stargazers_count: 50
    }));

    const houses = [];
    const trees = [];
    const lamps = [];
    
    // Each pair of houses takes 14 units of depth
    const pairs = Math.ceil(renderRepos.length / 2);
    const length = pairs * 14;

    renderRepos.forEach((repo, i) => {
      const isLeft = i % 2 === 0;
      const pairIdx = Math.floor(i / 2);
      const zPos = 2 - pairIdx * 14;

      houses.push({
        repo,
        position: [isLeft ? -11 : 11, 0, zPos],
        rotation: [0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0],
        wallColor: WALL_COLORS[(i + (isLeft ? 0 : 3)) % WALL_COLORS.length],
        roofColor: GET_STYLIZED_COLOR_FOR_LANG(repo.language) || ROOF_COLS[(i + (isLeft ? 0 : 4)) % ROOF_COLS.length],
        scale: 0.8 + Math.log10((repo.stargazers_count || 0) + 2) * 0.1
      });

      if (isLeft) {
        trees.push({ position: [-7.5, 0, zPos - 7], scale: 0.9 });
        trees.push({ position: [ 7.5, 0, zPos - 7], scale: 0.9 });
        lamps.push({ position: [-5, 0, zPos - 5] });
        lamps.push({ position: [ 5, 0, zPos - 5] });
      }
    });

    return { streetLength: length, streetHouses: houses, streetTrees: trees, streetLamps: lamps };
  }, [repos]);

  useEffect(() => {
    camera.fov = 38;
    camera.updateProjectionMatrix();
    // Start isometric
    const centerZ = -streetLength / 4; // Look slightly down the street
    gsap.to(camera.position, { x: 45, y: 45, z: centerZ + 45, duration: 1.8, ease: 'power3.out' });
    setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, centerZ);
        controlsRef.current.update();
      }
    }, 100);
  }, [camera, streetLength]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 0, -25]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={12}
        maxDistance={150}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Lighting – warm golden afternoon */}
      <SoftShadows size={18} samples={10} focus={0} />
      <ambientLight intensity={1.3} color="#ffd4a3" />
      <directionalLight
        position={[-35, 45, 25]}
        intensity={2.6}
        color="#ffedcc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={220}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[20, 25, -15]} intensity={0.45} color="#87CEEB" />
      <hemisphereLight skyColor="#87CEEB" groundColor="#74cf4a" intensity={0.55} />
      {/* Warm sun fill */}
      <pointLight position={[-30, 35, 10]} color="#ff9933" intensity={0.8} distance={120} decay={1.5} />

      {/* Road */}
      <Road length={streetLength} />

      {/* Houses */}
      {streetHouses.map((h, i) => (
        <StreetHouse 
          key={`sh-${i}`} 
          {...h} 
          onHover={() => setHoveredRepo && setHoveredRepo(h.repo)} 
          onUnhover={() => setHoveredRepo && setHoveredRepo(null)} 
        />
      ))}

      {/* Trees */}
      {streetTrees.map((t, i)  => <Tree key={`t-${i}`} position={t.position} scale={t.scale} />)}

      {/* Streetlamps */}
      {streetLamps.map((l, i)  => <VintageStreetLamp key={`l-${i}`} position={l.position} />)}

      {/* People */}
      {people.map((p, i) => <Person key={`p-${i}`} {...p} />)}

      {/* Animated Car */}
      <AnimatedCar color="#e63946" length={streetLength} />

      {/* Clouds */}
      {clouds.map((c, i) => <StreetCloud key={`sc-${i}`} position={c.position} scale={c.scale} />)}

      {/* Contact shadows */}
      <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={60} blur={2} far={15} resolution={512} />
    </>
  );
};
