/*! Stats page — loads data/github-stats.json */
(function initStatsPage() {
  const statusEl = document.getElementById('stats-status');
  const graphEl = document.getElementById('stats-graph');
  const metricsEl = document.getElementById('stats-metrics');
  const reposEl = document.getElementById('stats-repos');
  const updatedEl = document.getElementById('stats-updated');

  if (!graphEl || !metricsEl || !reposEl) return;

  const dataUrl = new URL('../data/github-stats.json', window.location.href).href;

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || '';
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Indiana/Indianapolis',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function formatRelative(iso) {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return iso;
    }
  }

  function renderGraph(weeks) {
    graphEl.replaceChildren();
    if (!weeks || !weeks.length) {
      graphEl.innerHTML = '<p class="stats-empty">Contribution data unavailable.</p>';
      return;
    }

    const monthLabels = document.createElement('div');
    monthLabels.className = 'stats-graph__months';
    monthLabels.setAttribute('aria-hidden', 'true');

    const grid = document.createElement('div');
    grid.className = 'stats-graph__grid';
    grid.setAttribute('role', 'img');
    grid.setAttribute(
      'aria-label',
      'GitHub contribution activity over the past year'
    );

    let lastMonth = '';
    weeks.forEach((week, weekIndex) => {
      const col = document.createElement('div');
      col.className = 'stats-graph__week';

      const firstDay = week.days && week.days[0];
      if (firstDay) {
        const month = new Date(firstDay.date + 'T12:00:00').toLocaleString(
          'en-US',
          { month: 'short' }
        );
        if (month !== lastMonth && weekIndex % 4 === 0) {
          const label = document.createElement('span');
          label.className = 'stats-graph__month';
          label.style.gridColumn = String(weekIndex + 1);
          label.textContent = month;
          monthLabels.appendChild(label);
          lastMonth = month;
        }
      }

      (week.days || []).forEach((day) => {
        const cell = document.createElement('span');
        cell.className = 'stats-graph__day';
        cell.dataset.level = String(day.level ?? 0);
        const count = day.count ?? 0;
        cell.title = `${day.date}: ${count} contribution${count === 1 ? '' : 's'}`;
        col.appendChild(cell);
      });

      grid.appendChild(col);
    });

    const legend = document.createElement('div');
    legend.className = 'stats-graph__legend';
    legend.setAttribute('aria-hidden', 'true');
    legend.innerHTML =
      '<span>Less</span>' +
      [0, 1, 2, 3, 4]
        .map((n) => `<span class="stats-graph__day" data-level="${n}"></span>`)
        .join('') +
      '<span>More</span>';

    graphEl.appendChild(monthLabels);
    graphEl.appendChild(grid);
    graphEl.appendChild(legend);
  }

  function renderMetrics(data) {
    const items = [
      { label: 'Public repositories', value: data.publicRepos },
      { label: 'Followers', value: data.followers },
      { label: 'Following', value: data.following },
      { label: 'Featured projects', value: data.featuredProjects },
      { label: 'Contributions (year)', value: data.totalContributions },
      { label: 'Current focus', value: data.currentFocus },
      { label: 'Location', value: data.location },
    ];

    metricsEl.replaceChildren();
    items.forEach((item) => {
      if (item.value === undefined || item.value === null || item.value === '') {
        return;
      }
      const card = document.createElement('div');
      card.className = 'stats-metric';
      card.innerHTML = `<p class="stats-metric__value"></p><p class="stats-metric__label"></p>`;
      card.querySelector('.stats-metric__value').textContent = String(item.value);
      card.querySelector('.stats-metric__label').textContent = item.label;
      metricsEl.appendChild(card);
    });
  }

  function renderRepos(repos) {
    reposEl.replaceChildren();
    if (!repos || !repos.length) {
      reposEl.innerHTML = '<p class="stats-empty">No recent repositories.</p>';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'stats-repos';
    list.setAttribute('role', 'list');

    repos.forEach((repo) => {
      const li = document.createElement('li');
      li.className = 'stats-repo';
      const link = document.createElement('a');
      link.href = repo.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = repo.name;
      const meta = document.createElement('p');
      meta.className = 'stats-repo__meta';
      const parts = [];
      if (repo.language) parts.push(repo.language);
      if (repo.updatedAt) parts.push(`Updated ${formatRelative(repo.updatedAt)}`);
      meta.textContent = parts.join(' · ');
      const desc = document.createElement('p');
      desc.className = 'stats-repo__desc';
      desc.textContent = repo.description || 'No description';
      li.appendChild(link);
      li.appendChild(desc);
      li.appendChild(meta);
      list.appendChild(li);
    });

    reposEl.appendChild(list);
  }

  setStatus('Loading GitHub stats…');

  fetch(dataUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      setStatus('');
      renderGraph(data.contributionWeeks);
      renderMetrics(data);
      renderRepos(data.recentRepos);
      if (updatedEl && data.generatedAt) {
        updatedEl.textContent = `Last refreshed ${formatDate(data.generatedAt)}`;
      }
    })
    .catch(() => {
      setStatus(
        'Could not load stats data. Try again later, or check data/github-stats.json.',
        true
      );
      graphEl.innerHTML = '';
      metricsEl.innerHTML = '';
      reposEl.innerHTML = '';
    });
})();
