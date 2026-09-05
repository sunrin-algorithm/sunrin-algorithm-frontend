import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(read)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('sharc-theme', theme)
    } catch {
      // private mode — the in-page theme still applies, it just won't persist
    }
  }, [theme])

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={theme === 'light' ? '어두운 테마로 전환' : '밝은 테마로 전환'}
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
    >
      <span className={theme === 'light' ? 'on' : undefined}>LIGHT</span>
      {' / '}
      <span className={theme === 'dark' ? 'on' : undefined}>DARK</span>
    </button>
  )
}
