import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { nasa } from '@/shared/api/nasa'

type FavMars = {
	id: number
	img_src: string
	earth_date?: string
	sol?: number
	rover: { name: string }
	camera: { name: string; full_name: string }
}

type FavApod = {
	date: string
	title: string
	url: string
	media_type: 'image' | 'video'
}

type FavEpic = {
	date: string
	image: string
}

type FavoriteItem = {
	uid: string
	source: 'mars' | 'apod' | 'epic'
	src: string
	title: string
	subtitle?: string
	dateLabel?: string
}

const FAV_MARS = 'mars:favorites'
const FAV_APOD = 'apod:favorites'
const FAV_EPIC = 'epic:favorites'

function readLocal<T>(key: string): T[] {
	try {
		const raw = localStorage.getItem(key)
		if (!raw) return []
		const parsed = JSON.parse(raw) as unknown
		return Array.isArray(parsed) ? (parsed as T[]) : []
	} catch {
		return []
	}
}

function writeLocal<T>(key: string, items: T[]): void {
	localStorage.setItem(key, JSON.stringify(items))
}

function normalizeMars(list: FavMars[]): FavoriteItem[] {
	return list.map((f) => ({
		uid: `mars:${f.id}`,
		source: 'mars' as const,
		src: f.img_src,
		title: `${f.rover.name} — ${f.camera.name}`,
		subtitle: f.camera.full_name,
		dateLabel: f.earth_date ?? (typeof f.sol === 'number' ? `Sol ${f.sol}` : undefined),
	}))
}

function normalizeApod(list: FavApod[]): FavoriteItem[] {
	return list
		.filter((a) => a.media_type === 'image')
		.map((a) => ({
			uid: `apod:${a.date}`,
			source: 'apod' as const,
			src: a.url,
			title: a.title,
			subtitle: 'APOD (Astronomy Picture of the Day)',
			dateLabel: a.date,
		}))
}

function normalizeEpic(list: FavEpic[]): FavoriteItem[] {
	return list.map((e) => ({
		uid: `epic:${e.date}:${e.image}`,
		source: 'epic' as const,
		src: nasa.epic.imageUrl(e.date, e.image),
		title: 'EPIC — Natural Color',
		subtitle: 'DSCOVR · Earth',
		dateLabel: e.date.split(' ')[0] ?? e.date,
	}))
}

export default function FavoritesPage() {
	const [marsFavs, setMarsFavs] = useState<FavMars[]>(() => readLocal<FavMars>(FAV_MARS))
	const [apodFavs, setApodFavs] = useState<FavApod[]>(() => readLocal<FavApod>(FAV_APOD))
	const [epicFavs, setEpicFavs] = useState<FavEpic[]>(() => readLocal<FavEpic>(FAV_EPIC))

	useEffect(() => {
		writeLocal(FAV_MARS, marsFavs)
	}, [marsFavs])
	useEffect(() => {
		writeLocal(FAV_APOD, apodFavs)
	}, [apodFavs])
	useEffect(() => {
		writeLocal(FAV_EPIC, epicFavs)
	}, [epicFavs])

	const items: FavoriteItem[] = useMemo(() => {
		const all = [...normalizeMars(marsFavs), ...normalizeApod(apodFavs), ...normalizeEpic(epicFavs)]
		return [...all].sort((a, b) => {
			if (!a.dateLabel && !b.dateLabel) return 0
			if (!a.dateLabel) return 1
			if (!b.dateLabel) return -1
			return a.dateLabel < b.dateLabel ? 1 : a.dateLabel > b.dateLabel ? -1 : 0
		})
	}, [marsFavs, apodFavs, epicFavs])

	const removeFavorite = (fav: FavoriteItem) => {
		if (fav.source === 'mars') {
			const id = Number(fav.uid.split(':')[1] ?? NaN)
			if (Number.isFinite(id)) {
				setMarsFavs((prev) => prev.filter((m) => m.id !== id))
			}
		} else if (fav.source === 'apod') {
			const date = fav.uid.split(':')[1] ?? ''
			setApodFavs((prev) => prev.filter((a) => a.date !== date))
		} else {
			const [, date, image] = fav.uid.split(':')
			setEpicFavs((prev) => prev.filter((e) => !(e.date === date && e.image === image)))
		}
	}

	return (
		<main className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-3xl font-extrabold tracking-tight'>
					<span className='bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent'>
						Favoritos
					</span>
				</h1>
				<p className='text-sm text-slate-600'>
					Aquí verás todas las imágenes que marcaste con{' '}
					<i className='pi pi-star-fill text-yellow-400 align-text-bottom' aria-hidden='true' />.
				</p>
			</header>

			{items.length === 0 ? (
				<section className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6'>
					<p className='text-sm text-slate-600'>Aún no has agregado imágenes a tus favoritos.</p>
					<div className='mt-3 text-sm'>
						<Link
							to='/mars'
							className='text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600'
						>
							Ir a Mars Rover Photos
						</Link>
					</div>
				</section>
			) : (
				<section aria-labelledby='favorites-grid-heading'>
					<h2 id='favorites-grid-heading' className='sr-only'>
						Lista de favoritos
					</h2>
					<ul role='list' className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{items.map((f) => (
							<li key={f.uid} role='listitem'>
								<article
									className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden'
									aria-labelledby={`fav-title-${f.uid}`}
								>
									<div className='relative'>
										<img
											src={f.src}
											alt={`${f.title}${f.dateLabel ? ` — ${f.dateLabel}` : ''}`}
											loading='lazy'
											decoding='async'
											sizes='(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'
											className='aspect-[4/3] w-full object-cover'
										/>
										<button
											type='button'
											onClick={() => removeFavorite(f)}
											className='absolute left-2 bottom-2 inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-1 shadow ring-1 ring-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600'
											aria-pressed='true'
											aria-label='Quitar de favoritos'
											title='Quitar de favoritos'
										>
											<i className='pi pi-star-fill text-yellow-400' aria-hidden='true' />
											<span className='sr-only'>Quitar de favoritos</span>
										</button>
									</div>

									<div className='p-3 text-sm'>
										<h3 id={`fav-title-${f.uid}`} className='font-semibold text-slate-900'>
											{f.title}
										</h3>
										{f.subtitle && <p className='text-slate-600'>{f.subtitle}</p>}
										{f.dateLabel && <p className='text-xs text-slate-500 mt-1'>{f.dateLabel}</p>}

										<div className='mt-2'>
											<span
												className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs ring-1 ring-slate-200'
												aria-label={`Origen: ${f.source}`}
												role='status'
											>
												<i
													className={`pi ${f.source === 'mars' ? 'pi-minecar' : f.source === 'apod' ? 'pi-image' : 'pi-globe'}`}
													aria-hidden='true'
												/>
												<span className='ml-1 uppercase'>{f.source}</span>
											</span>
										</div>
									</div>
								</article>
							</li>
						))}
					</ul>
				</section>
			)}
		</main>
	)
}
