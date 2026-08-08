import React, { useState } from 'react';

/** GitHub's own rule: 1–39 chars, alphanumeric or single hyphens, no edge hyphen. */
const GITHUB_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/**
 * Accepts a bare username, an @handle, or a pasted profile URL and returns
 * just the username.
 */
export function normalizeUsername(raw) {
  return raw
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .trim();
}

export function LoginScreen({ onSubmit }) {
  const [username, setUsername] = useState('');
  const [problem, setProblem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = normalizeUsername(username);

    if (!clean) {
      setProblem('Enter a GitHub username to build your world.');
      return;
    }
    if (!GITHUB_USERNAME.test(clean)) {
      setProblem(`“${clean}” isn't a valid GitHub username.`);
      return;
    }

    setProblem('');
    onSubmit(clean);
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
              placeholder="Enter your GitHub username"
              required
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (problem) setProblem('');
              }}
            />
          </div>
          <button type="submit" id="enter-btn">Generate My World →</button>
        </form>

        {problem && <p className="login-error">{problem}</p>}

        <p className="login-hint">
          Each repository becomes a unique house in your village — and you get a link you can share.
        </p>
      </div>
    </div>
  );
}
