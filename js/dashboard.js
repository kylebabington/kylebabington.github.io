(() => {
  const root = document.documentElement;
  const themeKey = 'kyle-portfolio-theme';
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme) root.dataset.theme = savedTheme;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      button.textContent = theme === 'light' ? '☾' : '☀';
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
    });
  });
  applyTheme(root.dataset.theme || 'dark');

  const clocks = document.querySelectorAll('[data-live-clock]');
  function updateClock() {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Indiana/Indianapolis',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
    clocks.forEach((clock) => { clock.textContent = `${formatted} EDT`; });
  }
  updateClock();
  setInterval(updateClock, 1000);

  const palette = document.querySelector('[data-command-palette]');
  const search = palette?.querySelector('[data-command-search]');
  const items = palette ? Array.from(palette.querySelectorAll('.command-item')) : [];
  const triggers = document.querySelectorAll('[data-command-trigger]');

  function openPalette() {
    if (!palette) return;
    palette.hidden = false;
    document.body.style.overflow = 'hidden';
    search?.focus();
    filterCommands('');
  }
  function closePalette() {
    if (!palette) return;
    palette.hidden = true;
    document.body.style.overflow = '';
  }
  function filterCommands(value) {
    const query = value.trim().toLowerCase();
    items.forEach((item) => {
      const haystack = (item.dataset.keywords || item.textContent || '').toLowerCase();
      item.hidden = Boolean(query && !haystack.includes(query));
    });
  }

  triggers.forEach((trigger) => trigger.addEventListener('click', openPalette));
  search?.addEventListener('input', (event) => filterCommands(event.target.value));
  palette?.addEventListener('click', (event) => {
    if (event.target === palette) closePalette();
    if (event.target.closest('.command-item')) closePalette();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      palette?.hidden ? openPalette() : closePalette();
    }
    if (event.key === 'Escape') closePalette();
  });

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
