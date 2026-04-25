import React from 'react';

export function LoadingScreen() {
  return (
    <div id="loading">
      <div className="loading-spinner" />
      <div className="loading-text">Building your GitVille…</div>
    </div>
  );
}
