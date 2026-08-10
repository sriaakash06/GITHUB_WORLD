import { useCallback, useEffect, useState } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * LIVE GITHUB DATA
 * ═══════════════════════════════════════════════════════════════════
 * Fetches a username's repos straight from the GitHub API on every visit.
 * Nothing is persisted anywhere — no database, no static snapshot, no
 * localStorage — so a shared /:username link always renders that account's
 * repos as they exist right now.
 */

const API = 'https://api.github.com';

/** Runaway guard: 10 pages × 100 = 1000 repos. Logged if it ever trips. */
const MAX_PAGES = 10;

/**
 * Whether starred repos also become houses.
 *
 * OFF, because starred repos belong to other people: including them made the
 * village show 26 houses while the dashboard's "Total Repos" (which counts only
 * owned repos) showed 25. One house per owned repo is the contract now.
 * Turning this back on will re-introduce that mismatch unless `repoCount`
 * below is changed to match.
 *
 * It also saves one API call per visit — unauthenticated GitHub requests are
 * capped at 60/hour per IP.
 */
export const INCLUDE_STARRED = false;

/**
 * Always hit the network. GitHub responds with `Cache-Control: max-age=60`,
 * and a cached response would show a stale village to someone who just
 * created a repo — exactly what this feature promises not to do.
 */
const FETCH_OPTS = {
  cache: 'no-store',
  headers: { Accept: 'application/vnd.github+json' },
};

export class GitHubError extends Error {
  constructor(kind, message, retryAfterMinutes = null) {
    super(message);
    this.name = 'GitHubError';
    this.kind = kind; // 'not-found' | 'rate-limit' | 'network' | 'unknown'
    this.retryAfterMinutes = retryAfterMinutes;
  }
}

function describeFailure(res, username) {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = Number(res.headers.get('x-ratelimit-reset'));

  if ((res.status === 403 || res.status === 429) && remaining === '0') {
    const mins = reset
      ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000))
      : null;
    return new GitHubError(
      'rate-limit',
      mins
        ? `GitHub's API rate limit was reached. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`
        : "GitHub's API rate limit was reached. Try again shortly.",
      mins
    );
  }

  if (res.status === 404) {
    return new GitHubError('not-found', `There's no GitHub user called “${username}”.`);
  }

  return new GitHubError(
    'unknown',
    `GitHub replied with ${res.status}${res.statusText ? ` ${res.statusText}` : ''}.`
  );
}

const mapRepo = (r, isStarred) => ({
  name: r.name,
  language: r.language || 'Other',
  stargazers_count: r.stargazers_count || 0,
  html_url: r.html_url,
  description: r.description || '',
  isStarred,
});

async function fetchPaged(baseUrl, username, signal, maxPages = MAX_PAGES) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${baseUrl}&page=${page}`, { ...FETCH_OPTS, signal });
    if (!res.ok) throw describeFailure(res, username);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < 100) break;

    if (page === maxPages) {
      console.warn(
        `[GitVille] stopped paginating at ${maxPages} pages (${out.length} items) for ${baseUrl}`
      );
    }
  }
  return out;
}

/**
 * @param {string} username taken from the /:username route param
 * @returns {{status:'idle'|'loading'|'ready'|'error', user, repos, error, reload}}
 */
export function useGitHubWorld(username) {
  const [state, setState] = useState({
    status: username ? 'loading' : 'idle',
    user: null,
    repos: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    if (!username) {
      setState({ status: 'idle', user: null, repos: [], error: null });
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let cancelled = false;

    setState({ status: 'loading', user: null, repos: [], error: null });

    (async () => {
      const who = encodeURIComponent(username);

      try {
        // 1. Profile first. It is the only reliable way to tell a typo'd
        //    username from a real account that simply has no repos yet —
        //    /repos answers 200 [] for both.
        const profileRes = await fetch(`${API}/users/${who}`, { ...FETCH_OPTS, signal });
        if (!profileRes.ok) throw describeFailure(profileRes, username);
        const profile = await profileRes.json();

        // 2. Every repo they own, across all pages.
        const owned = await fetchPaged(
          `${API}/users/${who}/repos?sort=updated&per_page=100`,
          username,
          signal
        );

        // 3. Starred repos — one page only, and never fatal.
        let starred = [];
        if (INCLUDE_STARRED) {
          try {
            starred = await fetchPaged(
              `${API}/users/${who}/starred?per_page=100`,
              username,
              signal,
              1
            );
          } catch (err) {
            if (err.name === 'AbortError') throw err;
            console.warn('[GitVille] could not load starred repos', err);
          }
        }

        const merged = [
          ...owned.map((r) => mapRepo(r, false)),
          ...starred.map((r) => mapRepo(r, true)),
        ];
        // Dedupe in case they starred their own repo.
        const repos = Array.from(new Map(merged.map((r) => [r.html_url, r])).values());

        if (cancelled) return;

        setState({
          status: 'ready',
          user: {
            username: profile.login || username,
            avatar: profile.avatar_url || '',
            repoCount: owned.length,
            starCount: owned.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
          },
          repos,
          error: null,
        });
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        const error =
          err instanceof GitHubError
            ? err
            : new GitHubError('network', "Couldn't reach GitHub. Check your connection and try again.");
        setState({ status: 'error', user: null, repos: [], error });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [username, attempt]);

  return { ...state, reload };
}
