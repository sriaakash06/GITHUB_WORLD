import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';

// Detailed Clay Shingled Roof using overlapping boxes on a prism base
const ShingledRoof = ({ width, depth, height, color }) => {
  const slopeAngle = Math.atan(height / (width / 2));
  const slopeLength = Math.sqrt(height * height + (width / 2) * (width / 2));
  
  // Base roof prism
  const baseGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, depth, height]);

  // Generate overlapping shingle overlays
  const shingleRows = 4;
  const shingles = useMemo(() => {
    const list = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let r = 0; r < shingleRows; r++) {
        // position along slope from bottom (0.1) to top (0.9)
        const t = (r + 0.25) / shingleRows;
        const dist = t * slopeLength;
        
        const sx = side * dist * Math.cos(slopeAngle);
        const sy = dist * Math.sin(slopeAngle);
        
        // 4 shingles along depth
        const shingleDepth = depth / 4;
        for (let dIdx = 0; dIdx < 4; dIdx++) {
          const sz = -depth / 2 + (dIdx + 0.5) * shingleDepth;
          list.push({
            key: `${side}-${r}-${dIdx}`,
            position: [sx, sy, sz],
            rotation: [0, 0, -side * slopeAngle],
            args: [0.35, 0.05, shingleDepth * 0.92]
          });
        }
      }
    }
    return list;
  }, [width, depth, height, slopeAngle, slopeLength]);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={baseGeo}>
        <meshStandardMaterial color={color} roughness={0.75} flatShading />
      </mesh>
      {shingles.map((s) => (
        <mesh key={s.key} position={s.position} rotation={s.rotation} castShadow>
          <boxGeometry args={s.args} />
          <meshStandardMaterial color={color} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// Corner vertical posts and cross beams for half-timbered styling
const TimberBeams = ({ w, h, d }) => {
  const beamColor = '#5a3f29'; // Rustic dark brown wood
  const thickness = 0.04;
  const beamW = 0.07;
  
  const diagL_side = Math.sqrt(d * d + h * h);
  const diagAngle_side = Math.atan(h / d);
  const diagL_back = Math.sqrt(w * w + h * h);
  const diagAngle_back = Math.atan(h / w);
  
  return (
    <group>
      {/* Corner vertical posts */}
      {[-w/2, w/2].map((x) => 
        [-d/2, d/2].map((z) => (
          <mesh key={`v-${x}-${z}`} position={[x, h/2, z]} castShadow>
            <boxGeometry args={[beamW, h, beamW]} />
            <meshStandardMaterial color={beamColor} roughness={0.9} flatShading />
          </mesh>
        ))
      )}
      
      {/* Front face framing */}
      <group position={[0, 0, d/2 + 0.005]}>
        <mesh position={[0, beamW/2, 0]} castShadow>
          <boxGeometry args={[w, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h - beamW/2, 0]} castShadow>
          <boxGeometry args={[w, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      </group>

      {/* Back face framing & diagonal cross brace */}
      <group position={[0, 0, -d/2 - 0.005]}>
        <mesh position={[0, beamW/2, 0]} castShadow>
          <boxGeometry args={[w, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h - beamW/2, 0]} castShadow>
          <boxGeometry args={[w, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, diagAngle_back]} castShadow>
          <boxGeometry args={[diagL_back, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, -diagAngle_back]} castShadow>
          <boxGeometry args={[diagL_back, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      </group>

      {/* Left face framing & X brace */}
      <group position={[-w/2 - 0.005, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <mesh position={[0, beamW/2, 0]} castShadow>
          <boxGeometry args={[d, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h - beamW/2, 0]} castShadow>
          <boxGeometry args={[d, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, diagAngle_side]} castShadow>
          <boxGeometry args={[diagL_side, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, -diagAngle_side]} castShadow>
          <boxGeometry args={[diagL_side, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      </group>

      {/* Right face framing & X brace */}
      <group position={[w/2 + 0.005, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <mesh position={[0, beamW/2, 0]} castShadow>
          <boxGeometry args={[d, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h - beamW/2, 0]} castShadow>
          <boxGeometry args={[d, beamW, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, diagAngle_side]} castShadow>
          <boxGeometry args={[diagL_side, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, h/2, 0]} rotation={[0, 0, -diagAngle_side]} castShadow>
          <boxGeometry args={[diagL_side, beamW * 0.7, thickness]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// Flower detail in garden
const Flower = ({ position, color }) => (
  <group position={position}>
    <mesh position={[0, 0.08, 0]} castShadow>
      <cylinderGeometry args={[0.015, 0.015, 0.16, 4]} />
      <meshStandardMaterial color="#22c55e" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.16, 0]} castShadow>
      <sphereGeometry args={[0.05, 5, 5]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  </group>
);

// Mini Garden with fence, path, flowers, and bushes
const MiniGarden = ({ baseW, baseD, wallW, wallD, shiftZ }) => {
  const fenceColor = '#6e4f35';
  const fenceHeight = 0.45;
  const pathZStart = wallD / 2 + shiftZ + 0.1;
  const pathZEnd = baseD / 2 - 0.05;

  return (
    <group>
      {/* Green grass top base */}
      <mesh position={[0, 0.155, 0]} receiveShadow>
        <boxGeometry args={[baseW - 0.08, 0.01, baseD - 0.08]} />
        <meshStandardMaterial color="#4f8a3c" roughness={0.9} flatShading />
      </mesh>

      {/* Stone pathway */}
      {Array.from({ length: 4 }).map((_, i) => {
        const t = i / 3;
        const z = pathZStart + t * (pathZEnd - pathZStart);
        return (
          <mesh key={`path-${i}`} position={[0, 0.162, z]} receiveShadow>
            <boxGeometry args={[0.55, 0.01, 0.28]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.9} flatShading />
          </mesh>
        );
      })}

      {/* Left Fence */}
      <mesh position={[-baseW / 2 + 0.04, 0.16 + fenceHeight / 2, (shiftZ + baseD/2 - wallD/2)/2]} castShadow>
        <boxGeometry args={[0.06, fenceHeight, baseD/2 - shiftZ + wallD/2]} />
        <meshStandardMaterial color={fenceColor} roughness={0.95} />
      </mesh>
      {/* Right Fence */}
      <mesh position={[baseW / 2 - 0.04, 0.16 + fenceHeight / 2, (shiftZ + baseD/2 - wallD/2)/2]} castShadow>
        <boxGeometry args={[0.06, fenceHeight, baseD/2 - shiftZ + wallD/2]} />
        <meshStandardMaterial color={fenceColor} roughness={0.95} />
      </mesh>
      {/* Front Fence - Left section */}
      <mesh position={[-(baseW/4 + 0.28), 0.16 + fenceHeight / 2, baseD / 2 - 0.04]} castShadow>
        <boxGeometry args={[baseW/2 - 0.56, fenceHeight, 0.06]} />
        <meshStandardMaterial color={fenceColor} roughness={0.95} />
      </mesh>
      {/* Front Fence - Right section */}
      <mesh position={[baseW/4 + 0.28, 0.16 + fenceHeight / 2, baseD / 2 - 0.04]} castShadow>
        <boxGeometry args={[baseW/2 - 0.56, fenceHeight, 0.06]} />
        <meshStandardMaterial color={fenceColor} roughness={0.95} />
      </mesh>

      {/* Flowers in yard */}
      <Flower position={[-baseW / 2 + 0.35, 0.17, 0.7]} color="#ef4444" />
      <Flower position={[-baseW / 2 + 0.55, 0.17, 1.05]} color="#ffb703" />
      <Flower position={[baseW / 2 - 0.35, 0.17, 0.85]} color="#ec4899" />
      <Flower position={[baseW / 2 - 0.55, 0.17, 1.15]} color="#3b82f6" />

      {/* Small bushes */}
      <mesh position={[baseW / 2 - 0.5, 0.32, 0.35]} castShadow>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color={PALETTE.foliageDark} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-baseW / 2 + 0.45, 0.28, 0.25]} castShadow>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color={PALETTE.foliage} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
};

// Animated Villager walking left/right
const Villager = ({ startX = 0, startZ = 1.25, boundaryX = 1.0, speed = 0.4, color }) => {
  const ref = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const posX = startX + Math.sin(time * speed) * boundaryX;
    
    const dirX = Math.cos(time * speed);
    ref.current.rotation.y = dirX >= 0 ? Math.PI / 2 : -Math.PI / 2;
    
    ref.current.position.x = posX;
    ref.current.position.y = 0.4 + Math.abs(Math.sin(time * speed * 4)) * 0.05;
    
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(time * speed * 8) * 0.4;
      rightLegRef.current.rotation.x = -Math.sin(time * speed * 8) * 0.4;
    }
  });

  return (
    <group ref={ref} position={[startX, 0.4, startZ]} scale={0.4}>
      {/* Head */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.8} />
      </mesh>
      {/* Straw Hat */}
      <mesh position={[0, 1.04, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.04, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.09, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} />
      </mesh>
      {/* Body / Shirt */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.6, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.08, 0.1, 0]} castShadow>
        <boxGeometry args={[0.07, 0.3, 0.07]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.08, 0.1, 0]} castShadow>
        <boxGeometry args={[0.07, 0.3, 0.07]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};

// Animated Villager walking front/back (Z-axis)
const ZVillager = ({ startX = -0.5, startZ = 1.1, boundaryZ = 0.4, speed = 0.5, color }) => {
  const ref = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const posZ = startZ + Math.sin(time * speed) * boundaryZ;
    
    const dirZ = Math.cos(time * speed);
    ref.current.rotation.y = dirZ >= 0 ? 0 : Math.PI;
    
    ref.current.position.z = posZ;
    ref.current.position.y = 0.4 + Math.abs(Math.sin(time * speed * 4)) * 0.05;
    
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(time * speed * 8) * 0.4;
      rightLegRef.current.rotation.x = -Math.sin(time * speed * 8) * 0.4;
    }
  });

  return (
    <group ref={ref} position={[startX, 0.4, startZ]} scale={0.4}>
      {/* Head */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.8} />
      </mesh>
      {/* Straw Hat */}
      <mesh position={[0, 1.04, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.04, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.09, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} />
      </mesh>
      {/* Body / Shirt */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.6, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.08, 0.1, 0]} castShadow>
        <boxGeometry args={[0.07, 0.3, 0.07]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.08, 0.1, 0]} castShadow>
        <boxGeometry args={[0.07, 0.3, 0.07]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};

// Window with flower box and frames
const SmallWindow = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    {/* Glass pane */}
    <mesh castShadow>
      <boxGeometry args={[0.4, 0.4, 0.06]} />
      <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.3} flatShading />
    </mesh>
    {/* Wood outer frame */}
    <mesh castShadow>
      <boxGeometry args={[0.46, 0.46, 0.03]} />
      <meshStandardMaterial color="#5a3f29" roughness={0.9} />
    </mesh>
    {/* Planter box under window */}
    <mesh position={[0, -0.26, 0.04]} castShadow>
      <boxGeometry args={[0.44, 0.1, 0.12]} />
      <meshStandardMaterial color="#5a3f29" roughness={0.9} flatShading />
    </mesh>
    {/* Flowers in window planter */}
    <mesh position={[-0.12, -0.18, 0.06]}>
      <sphereGeometry args={[0.045, 4, 4]} />
      <meshStandardMaterial color="#ef4444" flatShading />
    </mesh>
    <mesh position={[0, -0.18, 0.06]}>
      <sphereGeometry args={[0.045, 4, 4]} />
      <meshStandardMaterial color="#ffb703" flatShading />
    </mesh>
    <mesh position={[0.12, -0.18, 0.06]}>
      <sphereGeometry args={[0.045, 4, 4]} />
      <meshStandardMaterial color="#3b82f6" flatShading />
    </mesh>
  </group>
);

export default function GitVilleHouse({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  roofColor = '#e8832a',
  scale = 1,
  style = 0,
  floors = 1,
}) {
  const wallW   = 2.2 + (style % 2) * 0.3;
  const wallD   = 2.0 + ((style + 1) % 2) * 0.3;
  const baseWallH = 1.8 + (style % 3) * 0.2;
  
  const wallH   = baseWallH + (floors - 1) * 1.4;
  const roofH   = 0.9 + (style % 2) * 0.15;

  const wallColors = ['#f5e6d0', '#eedad8', '#dde8f0', '#e8f0de'];
  const wallColor = wallColors[style % wallColors.length];

  // Garden base dimensions
  const baseW = wallW + 1.8;
  const baseD = wallD + 1.8;
  const shiftZ = -0.4; // shift house back to leave a front garden yard

  const villagerColors = ['#dc2626', '#2563eb', '#16a34a', '#db2777'];
  const vColor1 = villagerColors[style % villagerColors.length];
  const vColor2 = villagerColors[(style + 2) % villagerColors.length];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* GARDEN BASE / STONE FOUNDATION */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseW, 0.3, baseD]} />
        <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
      </mesh>

      {/* MINI GARDEN (grass, fence, flowers, path) */}
      <MiniGarden baseW={baseW} baseD={baseD} wallW={wallW} wallD={wallD} shiftZ={shiftZ} />

      {/* ROAMING PEOPLE */}
      <Villager startX={0} startZ={wallD / 2 + shiftZ + 0.85} boundaryX={baseW / 2 - 0.55} speed={0.4 + (style % 3) * 0.08} color={vColor1} />
      {floors >= 2 && (
        <ZVillager startX={-0.6} startZ={wallD / 2 + shiftZ + 0.7} boundaryZ={0.35} speed={0.45} color={vColor2} />
      )}

      {/* HOUSE GROUP (shifted back along Z-axis) */}
      <group position={[0, 0, shiftZ]}>
        {/* HOUSE WALLS */}
        <mesh position={[0, wallH / 2 + 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallW, wallH, wallD]} />
          <meshStandardMaterial color={wallColor} flatShading roughness={0.85} />
        </mesh>

        {/* HALF-TIMBERED WOOD BEAMS ON WALLS */}
        <group position={[0, 0.3, 0]}>
          <TimberBeams w={wallW} h={wallH} d={wallD} />
        </group>

        {/* WALL TRIM / LEDGE */}
        <mesh position={[0, wallH + 0.35, 0]}>
          <boxGeometry args={[wallW + 0.15, 0.12, wallD + 0.15]} />
          <meshStandardMaterial color="#5a3f29" flatShading roughness={0.95} />
        </mesh>

        {/* PREMIUM SHINGLED ROOF */}
        <group position={[0, wallH + 0.42, 0]}>
          <ShingledRoof width={wallW + 0.4} depth={wallD + 0.4} height={roofH} color={roofColor} />
        </group>

        {/* CHIMNEY */}
        <mesh position={[wallW * 0.2, wallH + roofH * 0.55 + 0.3, wallD * 0.15]} castShadow>
          <boxGeometry args={[0.28, 0.55 + (floors > 3 ? 0.3 : 0), 0.28]} />
          <meshStandardMaterial color={PALETTE.chimney} flatShading />
        </mesh>
        <mesh position={[wallW * 0.2, wallH + roofH * 0.55 + 0.6 + (floors > 3 ? 0.3 : 0), wallD * 0.15]}>
          <boxGeometry args={[0.36, 0.12, 0.36]} />
          <meshStandardMaterial color="#5a3f29" flatShading roughness={0.9} />
        </mesh>

        {/* RUSTIC DOORWAY */}
        <group position={[0, 0.65 + 0.3, wallD / 2 + 0.025]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.95, 0.08]} />
            <meshStandardMaterial color="#a16207" roughness={0.95} flatShading />
          </mesh>
          {/* Iron decorative hinges */}
          <mesh position={[-0.18, 0.22, 0.05]} castShadow>
            <boxGeometry args={[0.18, 0.04, 0.01]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[-0.18, -0.22, 0.05]} castShadow>
            <boxGeometry args={[0.18, 0.04, 0.01]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Brass handle ring */}
          <mesh position={[0.16, 0, 0.055]}>
            <torusGeometry args={[0.045, 0.012, 6, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>

        {/* FRONT DOOR STEP */}
        <mesh position={[0, 0.24, wallD / 2 + 0.15]} castShadow>
          <boxGeometry args={[0.75, 0.12, 0.22]} />
          <meshStandardMaterial color={PALETTE.stone} flatShading />
        </mesh>

        {/* WINDOWS PER FLOOR */}
        {Array.from({ length: floors }).map((_, f) => {
          const floorY = 1.25 + f * 1.4;
          return (
            <group key={f}>
              {/* Front Windows */}
              {wallW > 2.3 ? (
                <>
                  <SmallWindow position={[-wallW * 0.27, floorY, wallD / 2 + 0.01]} />
                  <SmallWindow position={[wallW * 0.27, floorY, wallD / 2 + 0.01]} />
                </>
              ) : (
                f > 0 && <SmallWindow position={[wallW * 0.22, floorY, wallD / 2 + 0.01]} />
              )}
              
              {/* Side Windows */}
              <SmallWindow
                position={[wallW / 2 + 0.01, floorY, 0]}
                rotation={[0, Math.PI / 2, 0]}
              />
              <SmallWindow
                position={[-wallW / 2 - 0.01, floorY, 0]}
                rotation={[0, -Math.PI / 2, 0]}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}
