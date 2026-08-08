import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';

import { Experience } from '../experience/Experience';
import { HUD } from '../components/HUD';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { useGitHubWorld } from '../hooks/useGitHubWorld';
import { SKY_DAY, SKY_NIGHT } from '../experience/Constants';

/**
 * The shareable page. Everything it renders comes from the :username route
 * param — there is no hardcoded account anywhere in the data path — and the
 * repos are re-fetched from GitHub on every visit.
 */
export function World() {
  const { username } = useParams();
  const { status, user, repos, error, reload } = useGitHubWorld(username);

  const [isNightMode, setIsNightMode] = useState(false);
  const [hoveredRepo, setHoveredRepo] = useState(null);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [minStars, setMinStars] = useState(0);

  // Reset filters when the visitor switches to a different person's world.
  useEffect(() => {
    setSearchQuery('');
    setSelectedLanguage('');
    setMinStars(0);
    setHoveredRepo(null);
  }, [username]);

  useEffect(() => {
    // Don't claim a world exists when the lookup failed.
    const name = status === 'error' ? null : user?.username || username;
    document.title = name ? `${name}'s World · GitVille` : 'GitVille';
    return () => {
      document.title = 'GitVille';
    };
  }, [user, username, status]);

  const resetCamera = () => window.dispatchEvent(new CustomEvent('reset-camera'));

  const skyColor = isNightMode ? SKY_NIGHT : SKY_DAY;

  const filteredRepos = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return repos.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));
      const matchesLang = selectedLanguage ? r.language === selectedLanguage : true;
      const matchesStars = r.stargazers_count >= minStars;
      return matchesSearch && matchesLang && matchesStars;
    });
  }, [repos, searchQuery, selectedLanguage, minStars]);

  if (status === 'error') {
    return <ErrorScreen username={username} error={error} onRetry={reload} />;
  }

  const isLoading = status === 'loading' || status === 'idle';

  return (
    <div className="app-container">
      <Canvas
        shadows
        camera={{ position: [55, 55, 55], fov: 38 }}
        gl={{ antialias: true, toneMapping: 4 }}
        id="world-canvas"
      >
        <color attach="background" args={[skyColor]} />
        {/* Fog lives in <Experience> — its range scales with the island radius. */}

        <Experience
          repos={filteredRepos}
          user={user}
          isCinematic={isLoading}
          setHoveredRepo={setHoveredRepo}
          isNightMode={isNightMode}
        />
      </Canvas>

      {user && (
        <HUD
          user={user}
          repos={repos}
          hoveredRepo={hoveredRepo}
          onResetCamera={resetCamera}
          isNightMode={isNightMode}
          onToggleNightMode={() => setIsNightMode(!isNightMode)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          minStars={minStars}
          setMinStars={setMinStars}
        />
      )}

      {isLoading && <LoadingScreen username={username} />}
    </div>
  );
}
