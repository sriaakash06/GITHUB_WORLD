import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './experience/Experience';
import { LoginScreen } from './components/LoginScreen';
import { HUD } from './components/HUD';
import { LoadingScreen } from './components/LoadingScreen';

function App() {
  const [user, setUser]               = useState(null);
  const [repos, setRepos]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [isCinematic, setIsCinematic] = useState(true);
  const [hoveredRepo, setHoveredRepo] = useState(null);

  const fetchUserData = async (username) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=60`
      );
      if (!response.ok) throw new Error('User not found');
      const data = await response.json();

      const totalStars     = data.reduce((acc, r) => acc + r.stargazers_count, 0);
      const processedRepos = data.map((r) => ({
        name:             r.name,
        language:         r.language,
        stargazers_count: r.stargazers_count,
        commits:          Math.floor(Math.random() * 100) + r.stargazers_count,
        html_url:         r.html_url,
        description:      r.description,
      }));

      setRepos(processedRepos);
      setUser({
        username,
        avatar:    data[0]?.owner.avatar_url || '',
        repoCount: data.length,
        starCount: totalStars,
      });
      setIsCinematic(false);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetCamera = () => window.dispatchEvent(new CustomEvent('reset-camera'));

  const skyColor = '#93d8f5';

  return (
    <div className="app-container">
      {!user && <LoginScreen onLogin={fetchUserData} />}

      <Canvas
        shadows
        camera={{ position: [55, 55, 55], fov: 38 }}
        gl={{ antialias: true, toneMapping: 4 }}
        id="world-canvas"
      >
        <color attach="background" args={[skyColor]} />

        <Experience
          repos={repos}
          isCinematic={isCinematic}
          setHoveredRepo={setHoveredRepo}
        />
      </Canvas>

      {user && (
        <HUD
          user={user}
          hoveredRepo={hoveredRepo}
          onResetCamera={resetCamera}
        />
      )}
      {loading && <LoadingScreen />}
    </div>
  );
}

export default App;
