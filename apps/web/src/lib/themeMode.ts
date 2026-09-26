// themeMode.ts — Modo claro/oscuro del sistema (light | dark | system).
// Fuente única de verdad: localStorage['theme'] + clase en documentElement,
// sincronizada entre Settings y el sky-toggle de la barra superior vía evento.
export type ThemeMode = 'light' | 'dark' | 'system';

const EVENT = 'lifequest:theme-mode';

export function readThemeMode(): ThemeMode {
  const stored = localStorage.getItem('theme');
  return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'light';
}

export function resolveIsDark(mode: ThemeMode = readThemeMode()): boolean {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return mode === 'dark';
}

export function applyThemeMode(mode: ThemeMode) {
  localStorage.setItem('theme', mode);
  const isDark = resolveIsDark(mode);
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(isDark ? 'dark' : 'light');
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeThemeMode(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
