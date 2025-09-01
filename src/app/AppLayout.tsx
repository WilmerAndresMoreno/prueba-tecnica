import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
	return (
		<div className='min-h-screen bg-slate-50 text-slate-900'>
			<header className='bg-white shadow-sm'>
				<div className='max-w-[var(--max-w)] mx-auto px-4 py-3 flex items-center justify-between'>
					<h1 className='text-lg font-semibold'>NASA Explorer</h1>
					<nav>
						<ul className='flex gap-3'>
							<li>
								<Link to='/apod' className='text-sky-600'>
									APOD
								</Link>
							</li>
							<li>
								<Link to='/mars' className='text-sky-600'>
									MARS
								</Link>
							</li>
							<li>
								<Link to='/neo' className='text-sky-600'>
									NEO
								</Link>
							</li>
							<li>
								<Link to='/epic' className='text-sky-600'>
									EPIC
								</Link>
							</li>
							<li>
								<Link to='/favorites' className='text-sky-600'>
									FAVORITES
								</Link>
							</li>
						</ul>
					</nav>
				</div>
			</header>
			<main className='max-w-[var(--max-w)] mx-auto px-4 py-6'>
				<Outlet />
			</main>
		</div>
	)
}

export default AppLayout
