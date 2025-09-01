// src/pages/EpicPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SelectButton } from 'primereact/selectbutton'
import { Calendar, type CalendarProps } from 'primereact/calendar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'

import { useQuery } from '@tanstack/react-query'
import { nasa } from '@/shared/api/nasa'
import type { EpicItem } from '@/shared/api/types/epic'
import type { HttpError } from '@/shared/api/http'

/* ───────── utilidades ───────── */

type Mode = 'today' | 'date'

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

/* ───────── componente ───────── */

export default function EpicPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	// hoy normalizado
	const today = useMemo(() => {
		const t = new Date()
		t.setHours(0, 0, 0, 0)
		return t
	}, [])
	const todayStr = useMemo(() => toYMD(today), [today])

	// estado de controles (borrador)
	const [mode, setMode] = useState<Mode>((searchParams.get('mode') as Mode) || 'today')
	const [date, setDate] = useState<Date | null>(() => parseYMD(searchParams.get('date')))
	const onDateChange: CalendarOnChangeSingle = (e) => {
		const v = e.value
		setDate(v instanceof Date ? v : null)
	}

	// consulta gobernada por URL
	const qMode: Mode = (searchParams.get('mode') as Mode) || 'today'
	const qDateStr = searchParams.get('date') || ''

	// queries (error tipado como HttpError)
	const qToday = useQuery<EpicItem[], HttpError>({
		queryKey: ['epic', 'byDate', todayStr],
		queryFn: ({ signal }) => nasa.epic.byDate(todayStr, signal),
		enabled: qMode === 'today',
		staleTime: 60_000,
	})

	const qByDate = useQuery<EpicItem[], HttpError>({
		queryKey: ['epic', 'byDate', qDateStr],
		queryFn: ({ signal }) => nasa.epic.byDate(qDateStr, signal),
		enabled: qMode === 'date' && Boolean(qDateStr),
		staleTime: 60_000,
	})

	// fallback a “último disponible”
	const [useLatest, setUseLatest] = useState<boolean>(false)
	useEffect(() => {
		setUseLatest(false) // resetea si cambian parámetros de URL
	}, [qMode, qDateStr])

	const qLatest = useQuery<EpicItem[], HttpError>({
		queryKey: ['epic', 'latest'],
		queryFn: ({ signal }) => nasa.epic.latest(signal),
		enabled: useLatest,
		staleTime: 60_000,
	})

	// datos/estados activos
	const activeData: EpicItem[] | undefined = useLatest ? qLatest.data : qMode === 'today' ? qToday.data : qByDate.data

	const activeLoading = useLatest ? qLatest.isLoading : qMode === 'today' ? qToday.isLoading : qByDate.isLoading

	const activeError: HttpError | null =
		(useLatest ? qLatest.error : qMode === 'today' ? qToday.error : qByDate.error) ?? null

	// hooks que antes estaban después del return condicional → súbelos aquí
	const [openIdx, setOpenIdx] = useState<number | null>(null)
	const displayDay = useMemo(() => {
		if (!activeData || activeData.length === 0) return ''
		const d = activeData[0]?.date?.split(' ')[0]
		return d ?? ''
	}, [activeData])

	// bandera para no hacer return temprano (evita violar reglas de hooks)
	const is503 = activeError?.status === 503

	// botón Buscar → vuelca controles a la URL
	const canSearch = mode === 'today' || (mode === 'date' && Boolean(date))
	const onSearch = () => {
		const next = new URLSearchParams()
		next.set('mode', mode)
		if (mode === 'date' && date) next.set('date', toYMD(date))
		setSearchParams(next, { replace: false })
	}

	return (
		<main className='space-y-6'>
			{is503 ? (
				// ───── Vista 503 (solo imagen) ─────
				<div className='min-h-[60vh] flex items-center justify-center p-6'>
					<img
						src='/503.svg'
						alt='Servicio temporalmente no disponible (error 503)'
						className='max-w-[580px] w-full h-auto'
						loading='eager'
						decoding='async'
					/>
				</div>
			) : (
				// ───── Vista normal ─────
				<>
					{/* Encabezado */}
					<header className='space-y-1'>
						<h1 className='text-3xl font-extrabold tracking-tight'>
							<span className='bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent'>
								EPIC — Natural Color
							</span>
						</h1>
						<p className='text-sm text-slate-600'>
							Ver imágenes en color natural del satélite DSCOVR:{' '}
							<span className='font-medium'>día actual</span> o por{' '}
							<span className='font-medium'>fecha específica</span>.
						</p>
					</header>

					{/* Controles */}
					<section
						aria-labelledby='controls-heading'
						className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4'
					>
						<h2 id='controls-heading' className='sr-only'>
							Controles de consulta EPIC
						</h2>

						<div className='grid gap-4 md:grid-cols-[auto,1fr] items-end'>
							<div className='space-y-2'>
								<label htmlFor='mode' className='block text-sm font-medium text-slate-900'>
									Modo
								</label>
								<SelectButton
									id='mode'
									aria-label='Selecciona modo de consulta'
									value={mode}
									onChange={(e) => setMode(e.value as Mode)}
									options={[
										{ label: 'Hoy', value: 'today' as Mode },
										{ label: 'Fecha', value: 'date' as Mode },
									]}
								/>
							</div>

							{mode === 'date' ? (
								<div className='space-y-2'>
									<label htmlFor='date' className='block text-sm font-medium text-slate-900'>
										Fecha
									</label>
									<Calendar
										id='date'
										value={date ?? undefined}
										onChange={onDateChange}
										dateFormat='yy-mm-dd'
										showIcon
										maxDate={today}
										placeholder='YYYY-MM-DD'
										className='w-[260px]'
										aria-describedby='date-help'
									/>
									<p id='date-help' className='text-xs text-slate-500'>
										Selecciona una fecha (no posterior a hoy).
									</p>
								</div>
							) : (
								<div className='space-y-2'>
									<label className='block text-sm font-medium text-slate-900'>Fecha</label>
									<p className='text-sm text-slate-600'>
										Hoy: <span className='font-medium'>{toYMD(today)}</span>
									</p>
								</div>
							)}

							<div className='md:col-span-2'>
								<Button
									label='Buscar'
									icon='pi pi-search'
									onClick={onSearch}
									disabled={!canSearch}
									aria-disabled={!canSearch}
								/>
							</div>
						</div>
					</section>

					{/* Resultados */}
					<section aria-labelledby='results-heading'>
						<h2 id='results-heading' className='sr-only'>
							Resultados EPIC
						</h2>

						{activeLoading ? (
							<p className='text-sm text-slate-500'>Cargando…</p>
						) : !activeData || activeData.length === 0 ? (
							<>
								<p className='text-sm text-slate-500'>
									{qMode === 'today'
										? 'No hay imágenes para hoy.'
										: 'No hay imágenes para la fecha seleccionada.'}
								</p>
								{qMode === 'today' && (
									<div className='mt-2'>
										<Button
											label='Ver último disponible'
											icon='pi pi-history'
											severity='secondary'
											onClick={() => setUseLatest(true)}
										/>
									</div>
								)}
							</>
						) : (
							<>
								<div className='mb-2'>
									<p className='text-sm text-slate-600'>
										Mostrando imágenes de <span className='font-medium'>{displayDay}</span> (
										{activeData.length})
									</p>
								</div>

								<ul role='list' className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
									{activeData.map((item, idx) => {
										const [day] = (item.date ?? '').split(' ')
										const src = nasa.epic.imageUrl(item.date, item.image)
										const open = openIdx === idx
										const dialogId = `epic-${idx}`

										return (
											<li key={`${item.image}-${item.date}`} role='listitem'>
												<article
													className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden'
													aria-labelledby={`card-title-${idx}`}
												>
													<button
														type='button'
														className='group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600'
														onClick={() => setOpenIdx(idx)}
														aria-haspopup='dialog'
														aria-controls={dialogId}
														aria-expanded={open}
													>
														<img
															src={src}
															alt={`EPIC natural color — ${item.date}`}
															loading='lazy'
															decoding='async'
															sizes='(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'
															className='aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]'
														/>
													</button>

													<div className='p-3 text-sm'>
														<h3
															id={`card-title-${idx}`}
															className='font-semibold text-slate-900'
														>
															EPIC — {day}
														</h3>
														<p className='text-slate-600'>{item.date}</p>
													</div>
												</article>

												<Dialog
													id={dialogId}
													header={`EPIC — ${item.date}`}
													visible={open}
													modal
													blockScroll
													dismissableMask
													closeOnEscape
													onHide={() => setOpenIdx(null)}
													style={{ width: '60vw', maxWidth: '960px' }}
													breakpoints={{ '960px': '85vw', '641px': '100vw' }}
													draggable={false}
													resizable={false}
													pt={{ mask: { style: { background: 'rgba(2, 6, 23, 0.7)' } } }}
												>
													<figure className='m-0'>
														<img
															src={src}
															alt={`EPIC natural color — ${item.date}`}
															loading='eager'
															decoding='async'
															className='w-full h-auto rounded-md'
														/>
														<figcaption className='sr-only'>
															Imagen EPIC en color natural correspondiente a {item.date}.
														</figcaption>
													</figure>
												</Dialog>
											</li>
										)
									})}
								</ul>
							</>
						)}
					</section>
				</>
			)}
		</main>
	)
}
