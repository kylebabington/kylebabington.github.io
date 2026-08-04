/**
 * Regenerates data/github-stats.json from the GitHub API.
 * Intended for GitHub Actions (GITHUB_TOKEN) or local `gh` auth.
 */
const fs = require('fs');
const path = require('path');

const LOGIN = process.env.GITHUB_STATS_LOGIN || 'kylebabington';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'github-stats.json');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'kylebabington-portfolio-stats',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}\n${body}`);
  }
  return res.json();
}

function levelFor(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

async function main() {
  const user = await gh(`https://api.github.com/users/${LOGIN}`);
  const repos = await gh(
    `https://api.github.com/users/${LOGIN}/repos?per_page=10&sort=updated`
  );

  const graphql = await gh('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays { date contributionCount }
              }
            }
          }
        }
      }`,
      variables: { login: LOGIN },
    }),
  });

  if (graphql.errors) {
    throw new Error(JSON.stringify(graphql.errors, null, 2));
  }

  const calendar =
    graphql.data.user.contributionsCollection.contributionCalendar;

  const out = {
    generatedAt: new Date().toISOString(),
    login: user.login,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    location: 'Indianapolis',
    currentFocus: 'FamilyFlow',
    featuredProjects: 4,
    totalContributions: calendar.totalContributions,
    contributionWeeks: calendar.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: levelFor(d.contributionCount),
      })),
    })),
    recentRepos: repos.map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      url: r.html_url,
      updatedAt: r.updated_at,
      stars: r.stargazers_count,
    })),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(
    `Wrote ${OUT} (${out.totalContributions} contributions, ${out.contributionWeeks.length} weeks)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
