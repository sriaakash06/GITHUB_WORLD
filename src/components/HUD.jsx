import React, { useState } from 'react';

export function HUD({ user, onResetCamera, hoveredRepo }) {

  // Note: Hover interaction with 3D buildings will trigger these state updates via App context or events if needed
  // For now, let's just render the HUD elements.

  return (
    <div id="hud">
      <div className="top-left">
        <div className="user-info card">
          <img src={user.avatar} alt="Avatar" className="avatar" />
          <div className="stats">
            <h2 id="hud-username">@{user.username}</h2>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">Repos:</span> <span>{user.repoCount}</span>
              </div>
              <div className="stat">
                <span className="label">Stars:</span> <span>{user.starCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-center">
        <div className="legend card">
          <div className="legend-item"><span className="color js"></span> JS</div>
          <div className="legend-item"><span className="color py"></span> Python</div>
          <div className="legend-item"><span className="color go"></span> Go</div>
          <div className="legend-item"><span className="color rust"></span> Rust</div>
          <div className="legend-item"><span className="color ts"></span> TS</div>
          <div className="legend-item"><span className="color other"></span> Other</div>
        </div>
      </div>

      <div id="tooltip" className={`tooltip ${hoveredRepo ? '' : 'hidden'}`}>
        <h3>{hoveredRepo?.name || 'Repo Name'}</h3>
        <div className="tooltip-meta">
          <p>Language: {hoveredRepo?.language || 'Unknown'}</p>
          <p>Stars: {hoveredRepo?.stargazers_count || 0}</p>
        </div>
      </div>
      
      <button className="card mini-btn" onClick={onResetCamera}>Reset View</button>
    </div>
  );
}
