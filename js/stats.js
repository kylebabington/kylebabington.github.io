(() => {
  const username = 'kylebabington';
  const apiBase = `https://api.github.com/users/${username}`;

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value ?? '—';
  };

  async function getJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    return response.json();
  }

  function renderLanguages(repos) {
    const counts = new Map();
    repos.forEach((repo) => {
      if (!repo.fork && repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    });
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0) || 1;
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const container = document.getElementById('language-bars');
    if (!container) return;
    container.innerHTML = top.map(([language, count]) => {
      const pct = Math.round((count / total) * 100);
      return `<div class="language-row"><span>${language}</span><div class="language-track"><div class="language-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
    }).join('') || '<p class="stats-status">No public language data available yet.</p>';
  }

  function renderRepos(repos) {
    const container = document.getElementById('repo-list');
    if (!container) return;
    const selected = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 6);
    container.innerHTML = selected.map((repo) => `
      <div class="repo-row">
        <div>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
          <p>${repo.description || 'Public GitHub repository'}</p>
        </div>
        <div class="repo-meta">${repo.language || '—'} · ★ ${repo.stargazers_count}</div>
      </div>
    `).join('');
  }

  async function load() {
    const status = document.getElementById('stats-status');
    try {
      const [profile, repos] = await Promise.all([
        getJson(apiBase),
        getJson(`${apiBase}/repos?per_page=100&sort=pushed`),
      ]);
      setText('public-repos', profile.public_repos);
      setText('followers', profile.followers);
      setText('following', profile.following);
      setText('location', profile.location || 'Indianapolis, IN');
      setText('github-created', new Date(profile.created_at).getFullYear());
      setText('recent-push', repos[0] ? new Date(repos[0].pushed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
      renderLanguages(repos);
      renderRepos(repos);
      if (status) status.textContent = 'Live public GitHub data loaded.';
    } catch (error) {
      console.error(error);
      if (status) status.textContent = 'GitHub rate limit or network issue — profile links still work.';
    }
  }

  load();
})();
