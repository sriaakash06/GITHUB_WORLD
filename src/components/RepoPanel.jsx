import React from 'react';
import { LANG_COLORS } from '../experience/Constants';

/**
 * Side drawer showing the repo behind the house the visitor just clicked.
 * Everything here comes from the repo object already attached to that house —
 * no extra GitHub request.
 */
export function RepoPanel({ repo, username, onClose }) {
  if (!repo) return null;

  const langColor = LANG_COLORS[repo.language] || LANG_COLORS.Default;
  // Starred repos belong to someone else, so their own html_url is the truth.
  const repoUrl =
    repo.html_url || `https://github.com/${encodeURIComponent(username)}/${repo.name}`;

  return (
    <aside className="repo-panel" role="dialog" aria-label={`${repo.name} details`}>
      <div className="repo-panel-head">
        <span className="repo-panel-eyebrow">
          {repo.isStarred ? '★ Starred repo' : 'Repository'}
        </span>
        <button className="repo-panel-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <h2 className="repo-panel-name">{repo.name}</h2>

      <div className="repo-panel-meta">
        {repo.language && (
          <span className="repo-panel-chip">
            <span className="lang-dot" style={{ background: langColor }} />
            {repo.language}
          </span>
        )}
        <span className="repo-panel-chip">★ {repo.stargazers_count ?? 0}</span>
      </div>

      {repo.description ? (
        <p className="repo-panel-desc">{repo.description}</p>
      ) : (
        <p className="repo-panel-desc is-empty">No description provided.</p>
      )}

      <div className="repo-panel-actions">
        <a
          className="repo-panel-link"
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Repo ↗
        </a>
        <button className="ghost-btn" onClick={onClose}>
          ← Back to Village
        </button>
      </div>
    </aside>
  );
}
