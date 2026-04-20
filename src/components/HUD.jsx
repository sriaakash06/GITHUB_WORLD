import React from 'react';

export const HUD = ({ user }) => {
  return (
    <div id="hud">
      <div className="bottom-row">
        <h1 className="main-title">{user.username}'s GitVille</h1>
        <div className="population-info">
            Population: {user.repoCount}
        </div>
      </div>
    </div>
  );
};

