import React, { useState } from 'react';

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) onLogin(username.trim());
  };

  return (
    <div id="login-screen">
      <div className="login-card">
        <span className="login-icon">🏡</span>
        <h1>Git<span>Ville</span></h1>
        <p>Enter your GitHub username to generate your unique 3D isometric village.</p>

        <form id="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              id="username"
              placeholder="GitHub Username"
              required
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button type="submit" id="enter-btn">Enter Your Village →</button>
        </form>

        <p className="login-hint">Each repository becomes a unique house in your village.</p>
      </div>
    </div>
  );
}
