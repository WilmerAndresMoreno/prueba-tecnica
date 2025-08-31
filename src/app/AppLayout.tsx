import { Outlet } from 'react-router-dom'

export function AppLayout() {
	return (
		<>
			<h1>Layout</h1>
			<Outlet />
		</>
	)
}

export default AppLayout
