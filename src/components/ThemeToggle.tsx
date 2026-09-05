import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeTheme } from '../lib/theme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light' as const)

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={theme === 'light' ? '어두운 테마로 전환' : '밝은 테마로 전환'}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <span className={theme === 'light' ? 'on' : undefined}>LIGHT</span>
      {' / '}
      <span className={theme === 'dark' ? 'on' : undefined}>DARK</span>
    </button>
  )
}
