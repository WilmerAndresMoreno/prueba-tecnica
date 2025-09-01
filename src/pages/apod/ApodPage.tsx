import { useEffect, useMemo, useState } from 'react'
import { Calendar, type CalendarProps } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { useApodRange } from '@/features/apod/hooks'
import type { ApodItem } from '@/shared/api/types/apod'

type RangeArray = (Date | null)[]
type OnChangeRange = NonNullable<CalendarProps<'range', RangeArray>['onChange']>

const toYMD = (d: Date): string => {
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

export default function ApodPage() {
	const [dates, setDates] = useState<RangeArray | null>(null)
	const [active, setActive] = useState<ApodItem | null>(null)

	const onChange: OnChangeRange = (e) => setDates(e.value ?? null)

	const { start, end } = useMemo(() => {
		if (!dates || !dates[0] || !dates[1])
			return { start: undefined as string | undefined, end: undefined as string | undefined }
		const [a, b] = dates as [Date, Date]
		const s = a <= b ? a : b
		const e = b >= a ? b : a
		return { start: toYMD(s), end: toYMD(e) }
	}, [dates])

	const { data, error, isLoading } = useApodRange(start ?? '', end ?? '')

	useEffect(() => {
		if (error) console.error('APOD error:', error)
	}, [error])

	const items: ApodItem[] = useMemo(() => {
		if (!data) return []
		return data.filter((x) => x.media_type === 'image')
	}, [data])

	const today = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d
	}, [])

	return (
		<div className='space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-3xl font-extrabold tracking-tight'>
					<span className='bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent'>
						APOD
					</span>
					<span className='ml-2 align-middle text-base font-medium text-slate-400'>
						Astronomy Picture of the Day
					</span>
				</h1>
				<p className='text-sm text-slate-600'>
					{start && end ? (
						<>
							Rango seleccionado: <span className='font-medium'>{start}</span> →{' '}
							<span className='font-medium'>{end}</span>. Cambia el rango para consultar otras fechas.
						</>
					) : (
						<>
							Selecciona un <span className='font-semibold'>rango de fechas</span> para consultar la
							galería APOD de la NASA.
						</>
					)}
				</p>
			</div>

			<Calendar
				value={dates ?? undefined}
				onChange={onChange}
				selectionMode='range'
				readOnlyInput
				hideOnRangeSelection
				dateFormat='yy-mm-dd'
				showIcon
				maxDate={today}
			/>

			{!start || !end ? (
				<p className='text-sm text-slate-500'>Selecciona un rango de fechas.</p>
			) : isLoading ? (
				<p className='text-sm text-slate-500'>Cargando…</p>
			) : error ? (
				<p className='text-sm text-rose-600'>Ocurrió un error al cargar APOD.</p>
			) : items.length === 0 ? (
				<p className='text-sm text-slate-500'>No hay imágenes para el rango seleccionado.</p>
			) : (
				<ul role='list' className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{items.map((i) => {
						const dialogId = `apod-dialog-${i.date}`
						const isOpen = active?.date === i.date
						const thumb = i.url
						const full = i.hdurl ?? i.url

						return (
							<li key={i.date} role='listitem'>
								<article
									className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden'
									aria-labelledby={`apod-title-${i.date}`}
								>
									<button
										type='button'
										className='group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600'
										onClick={() => setActive(i)}
										aria-haspopup='dialog'
										aria-expanded={isOpen}
										aria-controls={dialogId}
									>
										<img
											src={thumb}
											srcSet={full ? `${thumb} 1x, ${full} 2x` : undefined}
											sizes='(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'
											alt={`${i.title} — ${i.date}`}
											loading='lazy'
											decoding='async'
											className='aspect-[16/10] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]'
										/>
									</button>

									<div className='p-3'>
										<h3
											id={`apod-title-${i.date}`}
											className='text-sm font-semibold text-slate-900'
										>
											{i.title}
										</h3>
										<p className='mt-1 text-xs text-slate-600'>
											{i.date}
											{i.copyright ? <span> · © {i.copyright}</span> : null}
										</p>
									</div>
								</article>

								<Dialog
									id={dialogId}
									header={i.title}
									visible={isOpen}
									modal
									onHide={() => setActive(null)}
									style={{ width: '60vw', maxWidth: '960px' }}
									breakpoints={{ '960px': '85vw', '641px': '100vw' }}
									draggable={false}
									resizable={false}
								>
									<figure className='m-0'>
										<img
											src={full}
											alt={`${i.title} — ${i.date}`}
											loading='eager'
											decoding='async'
											className='w-full h-auto rounded-md'
										/>
										<figcaption className='sr-only'>
											{i.title}. Fecha: {i.date}. {i.copyright ? `Créditos: ${i.copyright}.` : ''}
										</figcaption>
									</figure>

									<div className='mt-3 space-y-2'>
										<p className='text-sm leading-relaxed text-slate-800'>{i.explanation}</p>
										<dl className='text-xs text-slate-700 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 pt-2 border-t border-slate-200'>
											<dt className='font-medium'>Fecha</dt>
											<dd>{i.date}</dd>
											{i.copyright && (
												<>
													<dt className='font-medium'>Créditos</dt>
													<dd>{i.copyright}</dd>
												</>
											)}
											<dt className='font-medium'>Tipo</dt>
											<dd>Imagen</dd>
										</dl>
									</div>
								</Dialog>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
