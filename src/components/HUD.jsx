import React from 'react';

export const HUD = ({ user, onResetCamera, hoveredRepo }) => {
  return (
    <div id="hud">
      <div className="top-left card">
        <div className="user-info">
          <img src={user.avatar} alt={user.username} className="avatar" />
          <div className="stats">
            <h2>@{user.username}</h2>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">Repositories</span>
                <span className="value">{user.repoCount}</span>
              </div>
              <div className="stat">
                <span className="label">Total Stars</span>
                <span className="value">{user.starCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`tooltip card ${!hoveredRepo ? 'hidden' : ''}`}>
        {hoveredRepo && (
          <>
            <h3>{hoveredRepo.name}</h3>
            <div className="tooltip-meta">
              <div className="meta-item">
                <span>⭐</span>
                <span>{hoveredRepo.stargazers_count.toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span>💻</span>
                <span>{hoveredRepo.language || 'Markdown'}</span>
              </div>
              <div className="meta-item">
                <span>📦</span>
                <span>{hoveredRepo.commits} Commits</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bottom-center">
        <div className="legend card">
          <div className="legend-item">
            <div className="color js" style={{color: 'var(--js)'}}></div>
            <span>JS / TS</span>
          </div>
          <div className="legend-item">
            <div className="color py" style={{color: 'var(--py)'}}></div>
            <span>Python</span>
          </div>
          <div className="legend-item">
            <div className="color go" style={{color: 'var(--go)'}}></div>
            <span>Go</span>
          </div>
          <div className="legend-item">
            <div className="color rust" style={{color: 'var(--rust)'}}></div>
            <span>Rust</span>
          </div>
          <div className="legend-item">
            <div className="color other" style={{color: 'var(--other)'}}></div>
            <span>Other</span>
          </div>
        </div>
      </div>

      <button className="mini-btn reset-view" onClick={onResetCamera}>
        Reset Camera
      </button>
    </div>
  );
};
