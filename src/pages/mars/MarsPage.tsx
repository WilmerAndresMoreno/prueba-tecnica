import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Calendar, type CalendarProps } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { SelectButton } from 'primereact/selectbutton'
import { InputNumber } from 'primereact/inputnumber'
import { Paginator } from 'primereact/paginator'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'

import { useMarsEarthDate, useMarsSol } from '@/features/mars/hooks'
import type { MarsPhotosResponse, MarsPhoto } from '@/shared/api/types/mars'

const ROVERS = ['curiosity', 'opportunity', 'spirit'] as const
type Rover = (typeof ROVERS)[number]
type Mode = 'date' | 'sol'

type CameraCode = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' | 'PANCAM' | 'MINITES'
type CameraValue = CameraCode | 'ALL' | ''

const CAMERA_LABEL: Record<Exclude<CameraValue, 'ALL' | ''>, string> = {
	FHAZ: 'Front Hazard Avoidance Camera',
	RHAZ: 'Rear Hazard Avoidance Camera',
	MAST: 'Mast Camera',
	CHEMCAM: 'Chemistry and Camera Complex',
	MAHLI: 'Mars Hand Lens Imager',
	MARDI: 'Mars Descent Imager',
	NAVCAM: 'Navigation Camera',
	PANCAM: 'Panoramic Camera',
	MINITES: 'Miniature Thermal Emission Spectrometer',
}

const COMPATIBLE: Record<Rover, ReadonlySet<CameraCode>> = {
	curiosity: new Set(['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM']),
	opportunity: new Set(['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES']),
	spirit: new Set(['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES']),
}

const PER_PAGE = 25
const FAV_KEY = 'mars:favorites'

const toYMD = (d: Date): string => {
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}
const parseYMD = (s: string | null): Date | null => {
	if (!s) return null
	const [y, m, d] = s.split('-').map(Number)
	if (!y || !m || !d) return null
	const dt = new Date(y, m - 1, d)
	dt.setHours(0, 0, 0, 0)
	return dt
}

type CalendarOnChangeSingle = NonNullable<CalendarProps<'single', Date>['onChange']>
type PaginatorOnChange = NonNullable<React.ComponentProps<typeof Paginator>['onPageChange']>
type DropdownOnChange = NonNullable<React.ComponentProps<typeof Dropdown>['onChange']>
type SelectButtonOnChange = NonNullable<React.ComponentProps<typeof SelectButton>['onChange']>
type InputNumberOnValueChange = NonNullable<React.ComponentProps<typeof InputNumber>['onValueChange']>

type FavPhoto = Pick<MarsPhoto, 'id' | 'img_src' | 'earth_date' | 'sol'> & {
	rover: { name: MarsPhoto['rover']['name'] }
	camera: { name: MarsPhoto['camera']['name']; full_name: MarsPhoto['camera']['full_name'] }
}

const loadFavs = (): FavPhoto[] => {
	try {
		const raw = localStorage.getItem(FAV_KEY)
		return raw ? (JSON.parse(raw) as FavPhoto[]) : []
	} catch {
		return []
	}
}
const saveFavs = (list: FavPhoto[]) => {
	localStorage.setItem(FAV_KEY, JSON.stringify(list))
}

export default function MarsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	const [rover, setRover] = useState<Rover>((searchParams.get('rover') as Rover) || 'curiosity')
	const [mode, setMode] = useState<Mode>((searchParams.get('mode') as Mode) || 'date')
	const [earthDate, setEarthDate] = useState<Date | null>(parseYMD(searchParams.get('date')))
	const [sol, setSol] = useState<number | null>(searchParams.get('sol') ? Number(searchParams.get('sol')) : null)
	const [camera, setCamera] = useState<CameraValue>((searchParams.get('camera') as CameraValue) || '')

	const qMode: Mode = (searchParams.get('mode') as Mode) || 'date'
	const qRover: Rover = (searchParams.get('rover') as Rover) || 'curiosity'
	const qPage = Math.max(1, Number(searchParams.get('page') || 1))
	const qCameraParam = (() => {
		const c = searchParams.get('camera')
		return c && c !== 'ALL' ? (c as CameraCode) : undefined
	})()
	const qEarthDateStr = searchParams.get('date') || ''
	const qSol = searchParams.get('sol') ? Number(searchParams.get('sol')) : NaN

	const qDate = useMarsEarthDate(qRover, qEarthDateStr, qCameraParam, qPage)
	const qSolQ = useMarsSol(qRover, qSol, qCameraParam, qPage)
	const enabledByDate = qMode === 'date' && !!qEarthDateStr
	const enabledBySol = qMode === 'sol' && Number.isFinite(qSol)

	const data: MarsPhotosResponse | undefined = enabledByDate ? qDate.data : enabledBySol ? qSolQ.data : undefined
	const isLoading = enabledByDate ? qDate.isLoading : enabledBySol ? qSolQ.isLoading : false
	const error = enabledByDate ? qDate.error : enabledBySol ? qSolQ.error : undefined

	const today = useMemo(() => {
		const t = new Date()
		t.setHours(0, 0, 0, 0)
		return t
	}, [])

	const cameraOptions = useMemo(
		() => [
			{ label: 'Todas las cámaras', value: 'ALL' as CameraValue },
			...(
				['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES'] as CameraCode[]
			).map((code) => ({
				label: `${CAMERA_LABEL[code]} (${code})`,
				value: code as CameraValue,
				disabled: !COMPATIBLE[rover].has(code),
			})),
		],
		[rover]
	)

	const canSearch = mode === 'date' ? Boolean(earthDate) : Number.isFinite(sol ?? NaN)

	const onSearch = () => {
		const next = new URLSearchParams()
		next.set('mode', mode)
		next.set('rover', rover)
		if (camera && camera !== 'ALL') next.set('camera', camera)
		if (mode === 'date' && earthDate) next.set('date', toYMD(earthDate))
		if (mode === 'sol' && Number.isFinite(sol ?? NaN)) next.set('sol', String(sol))
		next.set('page', '1')
		setSearchParams(next, { replace: false })
	}

	const onPageChange: PaginatorOnChange = (e) => {
		const next = new URLSearchParams(searchParams)
		next.set('page', String(e.page + 1))
		setSearchParams(next, { replace: false })
	}

	const onCalendarChange: CalendarOnChangeSingle = (e) => {
		const v = e.value
		setEarthDate(v instanceof Date ? v : null)
	}
	const onSolChange: InputNumberOnValueChange = (e) => {
		setSol(typeof e.value === 'number' ? e.value : null)
	}
	const onRoverChange: SelectButtonOnChange = (e) => setRover(e.value as Rover)
	const onCameraChange: DropdownOnChange = (e) => setCamera(e.value as CameraValue)

	useEffect(() => {
		if (mode === 'date') setSol(null)
		else setEarthDate(null)
	}, [mode])

	const [favs, setFavs] = useState<FavPhoto[]>(() => loadFavs())
	const favIds = useMemo(() => new Set(favs.map((f) => f.id)), [favs])

	const isFav = (id: number) => favIds.has(id)
	const toFav = (p: MarsPhoto): FavPhoto => ({
		id: p.id,
		img_src: p.img_src,
		earth_date: p.earth_date,
		sol: p.sol,
		rover: { name: p.rover.name },
		camera: { name: p.camera.name, full_name: p.camera.full_name },
	})
	const toggleFav = (p: MarsPhoto) => {
		setFavs((curr) => {
			const exists = curr.some((f) => f.id === p.id)
			const next = exists ? curr.filter((f) => f.id !== p.id) : [...curr, toFav(p)]
			saveFavs(next)
			return next
		})
	}

	const [openId, setOpenId] = useState<number | null>(null)

	return (
		<main className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-3xl font-extrabold tracking-tight'>
					<span className='bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent'>
						Mars Rover Photos
					</span>
				</h1>
				<p className='text-sm text-slate-600'>
					Usa los filtros y presiona <span className='font-semibold'>Buscar</span>. Los resultados y la página
					quedarán en la URL.
				</p>
			</header>

			<section
				aria-labelledby='filters-heading'
				className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4'
			>
				<h2 id='filters-heading' className='sr-only'>
					Filtros de búsqueda
				</h2>

				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-3'>
						<div>
							<label htmlFor='rover' className='block text-sm font-medium text-slate-900'>
								Rover
							</label>
							<SelectButton
								id='rover'
								aria-label='Selecciona un rover'
								value={rover}
								options={ROVERS.map((r) => ({ label: r[0].toUpperCase() + r.slice(1), value: r }))}
								onChange={onRoverChange}
								className='mt-1'
							/>
						</div>

						<div>
							<label htmlFor='camera' className='block text-sm font-medium text-slate-900'>
								Cámara
							</label>
							<Dropdown
								id='camera'
								aria-label='Selecciona una cámara'
								value={camera}
								options={cameraOptions}
								onChange={onCameraChange}
								filter
								placeholder='Todas'
								className='mt-1 w-full'
								optionDisabled={(opt) => Boolean((opt as { disabled?: boolean }).disabled)}
								itemTemplate={(opt) => (
									<div className='text-sm'>
										{typeof opt === 'object' && opt !== null
											? (opt as { label?: string }).label
											: String(opt)}
									</div>
								)}
							/>
							{camera === 'ALL' && (
								<p className='mt-1 text-xs text-slate-600'>Sin filtro de cámara (todas).</p>
							)}
						</div>
					</div>

					<div className='space-y-3'>
						<div>
							<label htmlFor='mode' className='block text-sm font-medium text-slate-900'>
								Tipo de búsqueda
							</label>
							<SelectButton
								id='mode'
								aria-label='Selecciona tipo de búsqueda'
								value={mode}
								options={[
									{ label: 'Fecha', value: 'date' as Mode },
									{ label: 'Sol', value: 'sol' as Mode },
								]}
								onChange={(e) => setMode(e.value as Mode)}
								className='mt-1'
							/>
						</div>

						{mode === 'date' ? (
							<div>
								<label htmlFor='earth-date' className='block text-sm font-medium text-slate-900'>
									Fecha (Earth date)
								</label>
								<Calendar
									id='earth-date'
									value={earthDate ?? undefined}
									onChange={onCalendarChange}
									dateFormat='yy-mm-dd'
									showIcon
									maxDate={today}
									placeholder='YYYY-MM-DD'
									className='mt-1 w-full'
								/>
							</div>
						) : (
							<div>
								<label htmlFor='sol' className='block text-sm font-medium text-slate-900'>
									Sol (día marciano)
								</label>
								<InputNumber
									id='sol'
									value={sol ?? undefined}
									onValueChange={onSolChange}
									min={0}
									useGrouping={false}
									showButtons
									className='mt-1 w-full'
								/>
							</div>
						)}

						<div className='pt-1'>
							<Button
								label='Buscar'
								icon='pi pi-search'
								onClick={onSearch}
								disabled={!canSearch}
								aria-disabled={!canSearch}
							/>
						</div>
					</div>
				</div>
			</section>

			<section aria-labelledby='results-heading'>
				<h2 id='results-heading' className='sr-only'>
					Resultados
				</h2>

				{!enabledByDate && !enabledBySol ? (
					<p className='text-sm text-slate-500'>
						Configura filtros y pulsa <b>Buscar</b>.
					</p>
				) : isLoading ? (
					<p className='text-sm text-slate-500'>Cargando…</p>
				) : error ? (
					<p className='text-sm text-rose-600'>Error al cargar fotos.</p>
				) : !data || data.photos.length === 0 ? (
					<p className='text-sm text-slate-500'>Sin resultados.</p>
				) : (
					<>
						<ul role='list' className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							{data.photos.map((p) => {
								const open = openId === p.id
								const dialogId = `mars-photo-${p.id}`
								const fav = isFav(p.id)

								return (
									<li key={p.id} role='listitem'>
										<article
											className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden'
											aria-labelledby={`card-title-${p.id}`}
										>
											<div className='relative'>
												<button
													type='button'
													className='group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600'
													onClick={() => setOpenId(p.id)}
													aria-haspopup='dialog'
													aria-controls={dialogId}
													aria-expanded={open}
												>
													<img
														src={p.img_src}
														alt={`${p.rover.name} · ${p.camera.full_name} — ${p.earth_date ?? `Sol ${p.sol}`}`}
														loading='lazy'
														decoding='async'
														sizes='(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'
														className='aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]'
													/>
												</button>

												<button
													type='button'
													onClick={(e) => {
														e.stopPropagation()
														toggleFav(p)
													}}
													className='absolute left-2 bottom-2 inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-1 shadow ring-1 ring-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600'
													aria-pressed={fav}
													aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
													title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
												>
													<i
														className={`pi ${fav ? 'pi-star-fill text-yellow-400' : 'pi-star text-slate-500'}`}
														aria-hidden='true'
													/>
													<span className='sr-only'>{fav ? 'Favorito' : 'No favorito'}</span>
												</button>
											</div>

											<div className='p-3 text-sm'>
												<h3 id={`card-title-${p.id}`} className='font-semibold text-slate-900'>
													{p.rover.name} — {p.camera.name}
												</h3>
												<p className='text-slate-600'>{p.earth_date ?? `Sol ${p.sol}`}</p>
											</div>
										</article>

										<Dialog
											id={dialogId}
											header={`${p.rover.name} · ${p.camera.full_name}`}
											visible={open}
											modal
											blockScroll
											dismissableMask
											closeOnEscape
											onHide={() => setOpenId(null)}
											style={{ width: '60vw', maxWidth: '960px' }}
											breakpoints={{ '960px': '85vw', '641px': '100vw' }}
											draggable={false}
											resizable={false}
											pt={{
												mask: {
													style: {
														background: 'rgba(2, 6, 23, 0.16)',
														backdropFilter: 'blur(6px)',
														WebkitBackdropFilter: 'blur(6px)',
														transition: 'backdrop-filter .2s ease, background .2s ease',
													},
												},
											}}
										>
											<figure className='m-0'>
												<img
													src={p.img_src}
													alt={`${p.rover.name} · ${p.camera.full_name} — ${p.earth_date ?? `Sol ${p.sol}`}`}
													loading='eager'
													decoding='async'
													className='w-full h-auto rounded-md'
												/>
												<figcaption className='sr-only'>
													Foto de {p.rover.name} con {p.camera.full_name}.{' '}
													{p.earth_date ? `Fecha: ${p.earth_date}.` : `Sol: ${p.sol}.`}
												</figcaption>
											</figure>
										</Dialog>
									</li>
								)
							})}
						</ul>

						<div className='mt-4'>
							<Paginator
								first={(qPage - 1) * PER_PAGE}
								rows={PER_PAGE}
								totalRecords={
									data.photos.length === PER_PAGE
										? qPage * PER_PAGE + 1
										: (qPage - 1) * PER_PAGE + data.photos.length
								}
								onPageChange={onPageChange}
								template='FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'
								aria-label='Paginación de resultados'
							/>
						</div>
					</>
				)}
			</section>

			<section aria-labelledby='favorites-heading' className='mt-10'>
				<div className='flex items-baseline justify-between'>
					<h2 id='favorites-heading' className='text-lg font-semibold text-slate-900'>
						Favoritos
					</h2>
					<Link to='/favorites' className='text-sm font-medium text-sky-700 hover:underline'>
						Ver todos en “Favoritos”
					</Link>
				</div>

				{favs.length === 0 ? (
					<p className='mt-2 text-sm text-slate-500'>Aún no has agregado fotos a favoritos.</p>
				) : (
					<ul role='list' className='mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5'>
						{favs.map((f) => (
							<li key={f.id} role='listitem'>
								<article className='rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden'>
									<img
										src={f.img_src}
										alt={`${f.rover.name} · ${f.camera.full_name} — ${f.earth_date ?? `Sol ${f.sol}`}`}
										loading='lazy'
										decoding='async'
										className='aspect-[4/3] w-full object-cover'
									/>
									<div className='p-2'>
										<p className='text-xs text-slate-700 line-clamp-1'>
											{f.rover.name} — {f.camera.name}
										</p>
										<p className='text-[11px] text-slate-500'>{f.earth_date ?? `Sol ${f.sol}`}</p>
									</div>
								</article>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	)
}
