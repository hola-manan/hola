import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { StoreProvider } from './store'

// Pin the shell to a JS-measured pixel height so the tab bar sits flush from the
// first frame. `100dvh` resolves against a not-yet-settled viewport at initial
// paint (bar starts slightly up until the first resize); innerHeight is exact and,
// in a standalone PWA, stable and unaffected by the soft keyboard.
const setAppHeight = () =>
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
setAppHeight()
requestAnimationFrame(setAppHeight)
addEventListener('resize', setAppHeight)
addEventListener('orientationchange', setAppHeight)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
