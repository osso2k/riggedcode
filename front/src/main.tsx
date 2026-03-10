import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <div className="min-h-screen w-full bg-[hsl(0,0%,10%)] text-white">
    <StrictMode>
      <App />
    </StrictMode>
  </div>
)
