import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';

import { Experience } from '../experience/Experience';
import { HUD } from '../components/HUD';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { RepoPanel } from '../components/RepoPanel';
import { ProfilePanel } from '../components/ProfilePanel';
import { useGitHubWorld } from '../hooks/useGitHubWorld';
import { SKY_DAY, SKY_NIGHT } from '../experience/Constants';
import { QUALITY, IS_LOW_POWER } from '../experience/quality';

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
  // Lifted out of <Experience> so the HTML panels can read it.
  // null | { kind: 'repo', repo } | { kind: 'castle' }
  const [selection, setSelection] = useState(null);

  /**
   * Decorative-only visibility switches. Houses, castle, roads, moat and lamps
   * are deliberately not in here — they're the world itself, not decoration.
   */
  const [visibleProps, setVisibleProps] = useState({
    waterTower: true,
    windmill: true,
    wagon: true,
    stall: true,
    characters: true,
    balloons: true,
  });
  const toggleProp = (key) =>
    setVisibleProps((v) => ({ ...v, [key]: !v[key] }));

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
    setSelection(null);
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
        shadows={QUALITY.shadows}
        dpr={QUALITY.dpr}
        camera={{ position: [55, 55, 55], fov: 38, near: 0.5, far: 1200 }}
        gl={{ antialias: !IS_LOW_POWER, toneMapping: 4, powerPreference: 'high-performance' }}
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
          selectedRepo={selection}
          onSelectRepo={setSelection}
          visibleProps={visibleProps}
        />
      </Canvas>

      <RepoPanel
        repo={selection?.kind === 'repo' ? selection.repo : null}
        username={user?.username || username}
        onClose={() => setSelection(null)}
      />

      <ProfilePanel
        open={selection?.kind === 'castle'}
        user={user}
        onClose={() => setSelection(null)}
      />

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
          visibleProps={visibleProps}
          onToggleProp={toggleProp}
        />
      )}

      {isLoading && <LoadingScreen username={username} />}
    </div>
  );
}
