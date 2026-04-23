import React, { useMemo } from 'react';
import * as THREE from 'three';

const Box = ({ x, z, y, w, d, h, color, transparent = false, opacity = 1 }) => {
  return (
    <mesh
      position={[x + w / 2, y + h / 2, z + d / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        flatShading
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
};

const Roof = ({ x, z, y, w, d, h, color }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w / 2, h);
    shape.lineTo(0, 0);

    const extrudeSettings = {
      steps: 1,
      depth: d,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [w, h, d]);

  return (
    <mesh position={[x, y, z]} castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.8} flatShading />
    </mesh>
  );
};

export default function IslandHouse({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0], roofColor }) {
  const lowerRoofColor = roofColor || "#d48040";
  const upperRoofColor = roofColor || "#e08848";

  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* ISLAND LAYERS */}
      <Box x={-4} z={-4} y={-2} w={8} d={8} h={0.5} color="#b8a898" />
      <Box x={-3.6} z={-3.6} y={-1.5} w={7.2} d={7.2} h={0.5} color="#c4b49e" />
      <Box x={-3.2} z={-3.2} y={-1.0} w={6.4} d={6.4} h={0.5} color="#ccbba8" />
      <Box x={-2.8} z={-2.8} y={-0.5} w={5.6} d={5.6} h={0.5} color="#d4c4ae" />
      <Box x={-2.5} z={-2.5} y={0.0} w={5.0} d={5.0} h={0.5} color="#ddd0b8" />

      {/* TOP GROUND */}
      <Box x={-2.2} z={-2.2} y={0.5} w={4.4} d={4.4} h={0.28} color="#7ab860" />
      <Box x={-1.3} z={-0.9} y={0.78} w={2.6} d={2.0} h={0.1} color="#c4a868" />

      {/* RIGHT LEDGE */}
      <Box x={1.4} z={-1.0} y={0.0} w={2.0} d={1.8} h={0.8} color="#c8b89a" />
      <Box x={1.5} z={-0.8} y={0.8} w={1.8} d={1.4} h={0.14} color="#88aa50" />

      {/* LEFT FRONT LEDGE */}
      <Box x={-2.9} z={0.4} y={-0.5} w={2.0} d={2.0} h={0.7} color="#bfb090" />
      <Box x={-2.8} z={0.5} y={0.2} w={1.8} d={1.8} h={0.12} color="#78a040" />

      {/* POOL */}
      <mesh position={[-0.9 + 1.1, 1.5 + 0.7 + 0.11, -1.6]} receiveShadow>
          <boxGeometry args={[2.2, 0.22, 1.4]} />
          <meshStandardMaterial color="#5aaece" transparent opacity={0.85} roughness={0.1} metalness={0.1} />
      </mesh>
      {/* Wait, pool coords in original logic: poolMesh.position.set(-0.9 + 1.1, -1.6 + 0.11, 1.5 + 0.7); -> x, y, z in Three is (X, Y, Z). Let's use exact Box for Pool if possible, but the original was just manual position.set(x, y, z) but original was z as y? 
          Original: createBox(x, z, y... mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
          For pool: position.set(-0.9 + 1.1, -1.6 + 0.11, 1.5 + 0.7) -> X=0.2, Y=-1.49, Z=2.2.
      */}

      {/* LOWER HOUSE */}
      <Box x={-1.1} z={-0.8} y={0.88} w={2.2} d={1.7} h={1.35} color="#9ab0bc" />

      {/* PORCH */}
      <Box x={-1.25} z={0.9} y={0.88} w={2.5} d={0.5} h={0.1} color="#a07848" />
      <Box x={-1.15} z={1.35} y={0.98} w={2.3} d={0.08} h={0.22} color="#8a6030" />
      <Box x={-1.0} z={1.38} y={0.88} w={0.12} d={0.1} h={0.45} color="#7a5020" />
      <Box x={0.85} z={1.38} y={0.88} w={0.12} d={0.1} h={0.45} color="#7a5020" />

      {/* UPPER HOUSE */}
      <Box x={-0.85} z={-0.7} y={2.23} w={1.7} d={1.55} h={1.1} color="#a0b8c4" />

      {/* BALCONY */}
      <Box x={-0.95} z={0.85} y={2.23} w={1.9} d={0.38} h={0.08} color="#a07848" />
      <Box x={-0.85} z={1.18} y={2.31} w={1.7} d={0.07} h={0.18} color="#8a6030" />

      {/* LOWER ROOF (original x, z, y, w, d, h, color) */}
      <Roof x={-1.3} z={-1.0} y={3.3} w={2.6} d={1.9} h={0.85} color={lowerRoofColor} />
      
      {/* UPPER ROOF */}
      <Roof x={-1.05} z={-0.8} y={3.33} w={2.0} d={1.7} h={0.82} color={upperRoofColor} />

      {/* CHIMNEYS */}
      <Box x={-0.25} z={-0.5} y={4.0} w={0.22} d={0.22} h={0.55} color="#8a7060" />
      <Box x={0.1} z={-0.5} y={4.0} w={0.18} d={0.18} h={0.55} color="#8a7060" />

      {/* WINDOWS */}
      <Box x={-0.8} z={-0.81} y={1.3} w={0.45} d={0.04} h={0.5} color="#2a3a4a" />
      <Box x={0.1} z={-0.81} y={1.3} w={0.45} d={0.04} h={0.5} color="#2a3a4a" />
      <Box x={-0.5} z={-0.71} y={2.5} w={0.45} d={0.04} h={0.45} color="#2a3a4a" />

      {/* DOOR */}
      <Box x={-0.25} z={-0.81} y={0.88} w={0.5} d={0.04} h={0.65} color="#5a3820" />

      {/* BARRELS */}
      <Box x={-1.45} z={0.82} y={0.88} w={0.32} d={0.32} h={0.36} color="#8a6030" />
      <Box x={-1.45} z={1.22} y={0.88} w={0.28} d={0.28} h={0.36} color="#7a5020" />

      {/* TABLE */}
      <Box x={-2.5} z={0.95} y={0.2} w={0.75} d={0.55} h={0.07} color="#a07840" />
    </group>
  );
}
