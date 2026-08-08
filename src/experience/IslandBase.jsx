import React, { useMemo } from 'react';
import * as THREE from 'three';

export const IslandBase = React.memo(({ radius = 10, depth = 3.5 }) => {
  // Top grass disk geometry - low poly circular disk with slightly bumpy/organic vertex displacement
  const topGrassGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, 0.4, 32, 1);
    const pos = geo.attributes.position;
    
    // Seeded vertex perturbation for organic low-poly feel
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Perturb horizontal radius & top rim height slightly
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 0.1) {
        const angle = Math.atan2(z, x);
        const noise = Math.sin(angle * 7) * 0.4 + Math.cos(angle * 11) * 0.3 + Math.sin(angle * 3) * 0.5;
        pos.setX(i, x + (x / dist) * noise * 0.4);
        pos.setZ(i, z + (z / dist) * noise * 0.4);
      }

      if (y > 0) {
        const heightNoise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.15;
        pos.setY(i, y + heightNoise);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [radius]);

  // Lower rocky cliff underside geometry
  const cliffGeo = useMemo(() => {
    // Inverted cone / tapered cylinder for floating island body
    const geo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.1, depth, 24, 6);
    const pos = geo.attributes.position;

    // Displace vertices to form angular low-poly rock chunks & uneven cliff face
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const angle = Math.atan2(z, x);
      const dist = Math.sqrt(x * x + z * z);
      const layerFactor = 1 - (y + depth / 2) / depth; // 0 at top, 1 at bottom

      // Angular rock chunk displacement
      const chunkNoise = Math.sin(angle * 5 + y * 2) * 0.6 + Math.cos(angle * 9 - y * 3) * 0.4;
      const verticalJitter = (Math.sin(x * 3 + z * 5) - 0.5) * 0.25;

      pos.setX(i, x + (x / (dist || 1)) * chunkNoise * (1 - layerFactor * 0.5));
      pos.setZ(i, z + (z / (dist || 1)) * chunkNoise * (1 - layerFactor * 0.5));
      pos.setY(i, y + verticalJitter);
    }

    geo.computeVertexNormals();
    return geo;
  }, [radius, depth]);

  // Small floating rock debris / chunks underneath island
  const rockDebris = useMemo(() => {
    const rocks = [];
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + seed(i) * 0.5;
      const r = (seed(i + 1) * 0.5 + 0.3) * radius;
      const y = -depth - 0.5 - seed(i + 2) * 1.5;
      const scale = 0.3 + seed(i + 3) * 0.5;
      const rot = [seed(i + 4) * Math.PI, seed(i + 5) * Math.PI, seed(i + 6) * Math.PI];

      rocks.push({ position: [Math.cos(angle) * r, y, Math.sin(angle) * r], scale, rotation: rot });
    }
    return rocks;
  }, [radius, depth]);

  return (
    <group position={[0, 0, 0]}>
      {/* Top Grass Disk Surface */}
      <mesh geometry={topGrassGeo} position={[0, -0.2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#55aa44" roughness={0.85} flatShading />
      </mesh>

      {/* Rocky UnderSide Cliff Geometry */}
      <mesh geometry={cliffGeo} position={[0, -depth / 2 - 0.4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5c4d43" roughness={0.9} flatShading />
      </mesh>

      {/* Floating Rock Chunks Debris underneath */}
      {rockDebris.map((rock, i) => (
        <mesh key={`debris-${i}`} position={rock.position} rotation={rock.rotation} scale={rock.scale} castShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#4a3e37" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
});
