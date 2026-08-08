import React from 'react';

export function LoadingScreen({ username }) {
  return (
    <div id="loading">
      <div className="loading-spinner" />
      <div className="loading-text">
        {username ? `Building ${username}'s GitVille…` : 'Building your GitVille…'}
      </div>
    </div>
  );
}
