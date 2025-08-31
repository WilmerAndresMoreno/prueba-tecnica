import { createBrowserRouter } from 'react-router-dom'
import { ApodPage, EpicPage, FavoritesPage, MarsPage, NeoPage, NotFound } from '../../pages'
import AppLayout from '../AppLayout'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <ApodPage /> },
			{ path: 'apod', element: <ApodPage /> },
			{ path: 'epic', element: <EpicPage /> },
			{ path: 'favorites', element: <FavoritesPage /> },
			{ path: 'mars', element: <MarsPage /> },
			{ path: 'neo', element: <NeoPage /> },
			{ path: '*', element: <NotFound /> },
		],
	},
])
