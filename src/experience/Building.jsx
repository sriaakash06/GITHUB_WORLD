import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import { GET_STYLIZED_COLOR_FOR_LANG, ROOF_COLORS } from './Constants';
import GitVilleHouse from './GitVilleHouse';

export const Building = ({ repo, position, rotation, onHover, onUnhover, onClick, isSelected, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  const roofColor = useMemo(
    () => GET_STYLIZED_COLOR_FOR_LANG(repo.language) || ROOF_COLORS[index % ROOF_COLORS.length],
    [repo.language, index]
  );

  const scale = useMemo(
    () => 0.75 + Math.log10(repo.stargazers_count + 2) * 0.12,
    [repo.stargazers_count]
  );

  const floors = useMemo(() => {
    const stars = repo.stargazers_count || 0;
    if (stars < 10) return 1;
    if (stars < 50) return 2;
    if (stars < 200) return 3;
    if (stars < 1000) return 4;
    return 4 + Math.floor(Math.log10(stars / 100)); // Logarithmic scaling for huge repos
  }, [repo.stargazers_count]);

  const heightOffset = floors * 1.4 + 2.5;

  // Smooth hover pop animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered || isSelected ? scale * 1.18 : scale;
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
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        onHover && onHover();
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
        onUnhover && onUnhover();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (onClick) onClick(repo, position);
      }}
    >
      <GitVilleHouse
        roofColor={roofColor}
        style={index % 4}
        floors={floors}
      />
      {hovered && (
        <pointLight position={[0, heightOffset - 1, 0]} intensity={3} distance={12} color={roofColor} />
      )}
      {repo.isStarred && (
        <Float speed={3} rotationIntensity={2} floatIntensity={2} position={[0, heightOffset - 1, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.6]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
          </mesh>
        </Float>
      )}

      {isSelected && (
        <Html position={[0, heightOffset + 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className="repo-modal" style={{
            background: 'rgba(20, 25, 35, 0.95)',
            border: `2px solid ${roofColor}`,
            borderRadius: '12px',
            padding: '20px',
            width: '300px',
            color: '#fff',
            boxShadow: `0 10px 40px ${roofColor}40`,
            backdropFilter: 'blur(8px)',
            animation: 'fadeInUp 0.3s ease-out forwards',
            pointerEvents: 'auto',
            fontFamily: 'Inter, sans-serif'
          }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.3rem', color: roofColor, wordBreak: 'break-word' }}>{repo.name}</h2>
            <p style={{ margin: '0 0 15px', fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.4, maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {repo.description || 'No description provided.'}
            </p>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                ⭐ {repo.stargazers_count}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                💻 {repo.language || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                🔄 {repo.commits}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{
                flex: 1,
                background: roofColor,
                color: '#fff',
                textAlign: 'center',
                padding: '10px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                transition: 'opacity 0.2s',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }} onPointerOver={(e) => e.target.style.opacity = '0.8'} onPointerOut={(e) => e.target.style.opacity = '1'}>
                View on GitHub
              </a>
            </div>
          </div>
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(15px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
};
