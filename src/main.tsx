import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initTheme } from './lib/theme'
import './styles/global.css'

initTheme()

// Act I plays once, from the top, on every load -- a restored scroll offset
// would pin the page mid-document while the animation ran offscreen.
history.scrollRestoration = 'manual'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
