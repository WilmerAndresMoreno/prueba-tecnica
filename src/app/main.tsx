import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import RouterAppProvider from './providers/RouterProvider'
import { QueryProvider } from './providers/QueryProvider'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryProvider>
			<RouterAppProvider />
		</QueryProvider>
	</StrictMode>
)
