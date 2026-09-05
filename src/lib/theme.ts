export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()
let current: Theme = 'light'

/** The pre-paint script in index.html already decided; read it back once. */
export function initTheme() {
  current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export const subscribeTheme = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const getTheme = () => current

export function setTheme(next: Theme) {
  if (next === current) return
  current = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem('sharc-theme', next)
  } catch {
    // private mode — the in-page theme still applies, it just won't persist
  }
  for (const fn of listeners) fn()
}
