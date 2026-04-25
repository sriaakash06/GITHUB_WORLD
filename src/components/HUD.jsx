import React from 'react';

export const HUD = ({ user, hoveredRepo, onResetCamera }) => {
  return (
    <div id="hud">
      {/* Top-right controls */}
      <div className="hud-top">
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

      {/* Hovered repo tooltip */}
      {hoveredRepo && (
        <div className="repo-tooltip">
          <div className="repo-name">{hoveredRepo.name}</div>
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
        {/* Village name */}
        <div className="hud-title-block">
          <div className="hud-eyebrow">GitVille</div>
          <h1 className="hud-village-name">{user.username}'s World</h1>
          <div className="hud-subtitle">Your GitHub universe in 3D</div>
        </div>

        {/* Stats */}
        <div className="hud-stats">
          <div className="stat-pill">
            <span className="stat-value">{user.repoCount}</span>
            <span className="stat-label">Repos</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{user.starCount}</span>
            <span className="stat-label">Stars</span>
          </div>
        </div>
      </div>
    </div>
  );
};
