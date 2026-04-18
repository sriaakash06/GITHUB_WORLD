import React from 'react';

export function LoadingScreen() {
  return (
    <div id="loading">
      <div className="loader-container">
        <div className="loader"></div>
        <p>Constructing World...</p>
      </div>
    </div>
  );
}
