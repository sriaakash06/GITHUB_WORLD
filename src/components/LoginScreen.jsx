import React, { useState } from 'react';

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div id="login-screen">
      <div className="glass-card">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>GitHub <span>World</span></h1>
        </div>
        <p>Enter your username to generate your unique 3D isometric universe.</p>
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
          <button type="submit" id="enter-btn">Enter World</button>
        </form>
      </div>
    </div>
  );
}
