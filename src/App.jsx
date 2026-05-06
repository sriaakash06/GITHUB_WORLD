import React, { useState, useMemo } from 'react';
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
  const [isNightMode, setIsNightMode] = useState(false);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [minStars, setMinStars] = useState(0);

  const fetchUserData = async (username) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=40`
      );
      if (!response.ok) throw new Error('User not found');
      const data = await response.json();

      let starredData = [];
      try {
        const starredResponse = await fetch(
          `https://api.github.com/users/${username}/starred?per_page=20`
        );
        if (starredResponse.ok) {
          starredData = await starredResponse.json();
        }
      } catch (e) {
        console.warn("Could not fetch starred repos", e);
      }

      const totalStars     = data.reduce((acc, r) => acc + r.stargazers_count, 0);
      
      const processedRepos = [
        ...data.map((r) => ({
          name:             r.name,
          language:         r.language,
          stargazers_count: r.stargazers_count,
          commits:          Math.floor(Math.random() * 100) + r.stargazers_count,
          html_url:         r.html_url,
          description:      r.description,
          isStarred:        false,
        })),
        ...starredData.map((r) => ({
          name:             r.name,
          language:         r.language,
          stargazers_count: r.stargazers_count,
          commits:          Math.floor(Math.random() * 100) + r.stargazers_count,
          html_url:         r.html_url,
          description:      r.description,
          isStarred:        true,
        }))
      ];

      // Remove duplicates based on html_url (if user starred their own repo)
      const uniqueRepos = Array.from(new Map(processedRepos.map(r => [r.html_url, r])).values());

      setRepos(uniqueRepos);
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

  const skyColor = isNightMode ? '#0B1021' : '#93d8f5';

  const filteredRepos = useMemo(() => {
    return repos.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang = selectedLanguage ? r.language === selectedLanguage : true;
      const matchesStars = r.stargazers_count >= minStars;
      return matchesSearch && matchesLang && matchesStars;
    });
  }, [repos, searchQuery, selectedLanguage, minStars]);

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
          repos={filteredRepos}
          user={user}
          isCinematic={isCinematic}
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
      {loading && <LoadingScreen />}
    </div>
  );
}

export default App;
