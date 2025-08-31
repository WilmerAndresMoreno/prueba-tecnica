import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import RouterAppProvider from './providers/RouterProvider'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RouterAppProvider />
	</StrictMode>
)
