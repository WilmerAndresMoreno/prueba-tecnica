import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
	return (
		<>
			<header>
				<h1>NASA Explorer</h1>
				<nav>
					<ul>
						<li>
							<Link to='/apod'>APOD</Link>
						</li>
						<li>
							<Link to='/mars'>Mars Rover</Link>
						</li>
						<li>
							<Link to='/neo'>NeoWs</Link>
						</li>
						<li>
							<Link to='/epic'>EPIC</Link>
						</li>
						<li>
							<Link to='/favorites'>Favorites </Link>
						</li>
					</ul>
				</nav>
			</header>
			<main>
				<Outlet />
			</main>
		</>
	)
}

export default AppLayout
