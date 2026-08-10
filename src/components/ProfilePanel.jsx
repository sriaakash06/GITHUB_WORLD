import React from 'react';

/**
 * Shown when the castle is clicked. The castle stands for the whole profile
 * rather than any single repo, so this carries the account's headline numbers
 * instead of repo details. Same drawer styling as RepoPanel.
 */
export function ProfilePanel({ open, user, onClose }) {
  if (!open || !user) return null;

  const profileUrl = `https://github.com/${encodeURIComponent(user.username)}`;

  return (
    <aside className="repo-panel" role="dialog" aria-label={`${user.username} profile`}>
      <div className="repo-panel-head">
        <span className="repo-panel-eyebrow">Village Castle</span>
        <button className="repo-panel-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="profile-identity">
        {user.avatar && (
          <img className="profile-avatar" src={user.avatar} alt={user.username} />
        )}
        <h2 className="repo-panel-name">{user.username}</h2>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{user.repoCount}</span>
          <span className="profile-stat-label">Repos</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user.starCount}</span>
          <span className="profile-stat-label">Stars</span>
        </div>
      </div>

      <p className="repo-panel-desc">
        Every repository in this account is a cottage in the village below.
      </p>

      <div className="repo-panel-actions">
        <a
          className="repo-panel-link"
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Profile ↗
        </a>
        <button className="ghost-btn" onClick={onClose}>
          ← Back to Village
        </button>
      </div>
    </aside>
  );
}
