import React, { useMemo } from 'react';

export const HUD = ({ 
  user, 
  repos,
  hoveredRepo, 
  onResetCamera, 
  isNightMode, 
  onToggleNightMode,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  minStars,
  setMinStars
}) => {

  const languages = useMemo(() => {
    if (!repos) return [];
    const counts = {};
    repos.forEach(r => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [repos]);

  const topLanguages = languages.slice(0, 3);
  const allLanguages = languages.map(l => l[0]).sort();

  return (
    <div id="hud">
      {/* Top-right controls */}
      <div className="hud-top">
        <button className="reset-btn" onClick={onToggleNightMode}>
          {isNightMode ? '☀️ Day Mode' : '🌙 Night Mode'}
        </button>
        <button className="reset-btn" onClick={onResetCamera}>⌖ Reset View</button>

        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.username}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 2px 8px rgba(45,32,24,0.2)',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Sidebar Overlay */}
      <div className="hud-sidebar">
        <div className="sidebar-section">
          <h2 className="sidebar-title">Dashboard</h2>
          
          <div className="hud-stats-vertical">
            <div className="stat-pill-v">
              <span className="stat-label">Total Repos</span>
              <span className="stat-value">{user.repoCount}</span>
            </div>
            <div className="stat-pill-v">
              <span className="stat-label">Total Stars</span>
              <span className="stat-value">{user.starCount}</span>
            </div>
          </div>
        </div>

        {topLanguages.length > 0 && (
          <div className="sidebar-section">
            <h3 className="sidebar-subtitle">Most Used Languages</h3>
            <div className="lang-list">
              {topLanguages.map(([lang, count]) => (
                <div key={lang} className="lang-item">
                  <span className="lang-name">{lang}</span>
                  <span className="lang-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-section">
          <h3 className="sidebar-subtitle">Find Repositories</h3>
          <div className="filter-group">
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="glass-select" 
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
            >
              <option value="">All Languages</option>
              {allLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="range-label">
              <span>Min Stars:</span>
              <span>{minStars}</span>
            </div>
            <input 
              type="range" 
              className="glass-range"
              min="0" 
              max="5000" 
              step="1"
              value={minStars}
              onChange={e => setMinStars(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Hovered repo tooltip (village only) */}
      {hoveredRepo && (
        <div className="repo-tooltip">
          <div className="repo-name">
            {hoveredRepo.name} {hoveredRepo.isStarred && <span style={{fontSize: '0.8em', color: '#ffd700', marginLeft: '6px'}}>★ Starred</span>}
          </div>
          {hoveredRepo.language && (
            <div className="repo-lang">{hoveredRepo.language}</div>
          )}
          {hoveredRepo.description && (
            <div className="repo-desc">{hoveredRepo.description}</div>
          )}
          <div className="repo-stars">★ {hoveredRepo.stargazers_count} stars</div>
        </div>
      )}

      {/* Bottom row */}
      <div className="hud-bottom">
        <div className="hud-title-block">
          <div className="hud-eyebrow">GitVille</div>
          <h1 className="hud-village-name">{user.username}'s World</h1>
          <div className="hud-subtitle">Your GitHub universe in 3D</div>
        </div>
      </div>
    </div>
  );
};
