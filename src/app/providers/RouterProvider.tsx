import { RouterProvider } from 'react-router-dom'
import { router } from '../routes/router'

export default function RouterAppProvider() {
	return <RouterProvider router={router} />
}
