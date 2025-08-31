import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../AppLayout'
import { lazy } from 'react'

const ApodPage = lazy(() => import('@/pages/apod/ApodPage'))
const EpicPage = lazy(() => import('@/pages/epic/EpicPage'))
const FavoritesPage = lazy(() => import('@/pages/favorites/FavoritesPage'))
const MarsPage = lazy(() => import('@/pages/mars/MarsPage'))
const NeoPage = lazy(() => import('@/pages/neo/NeoPage'))
const NotFound = lazy(() => import('@/pages/not-found/not-found'))

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
