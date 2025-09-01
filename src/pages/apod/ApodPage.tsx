// src/pages/ApodPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Calendar, type CalendarProps } from 'primereact/calendar'
import { useApodRange } from '@/features/apod/hooks'

type RangeArray = (Date | null)[]
// Tipo correcto del onChange cuando selectionMode = "range"
type OnChangeRange = NonNullable<CalendarProps<'range', RangeArray>['onChange']>

const toYMD = (d: Date): string => {
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

export default function ApodPage() {
	const [dates, setDates] = useState<RangeArray | null>(null)

	// e.value: (Date|null)[] | undefined → guardamos null si aún no hay rango completo
	const onChange: OnChangeRange = (e) => {
		setDates(e.value ?? null)
	}

	const { start, end } = useMemo(() => {
		if (!dates || !dates[0] || !dates[1]) {
			return { start: undefined as string | undefined, end: undefined as string | undefined }
		}
		// En "range", PrimeReact permite nulls; aquí están validadas.
		const [a, b] = dates as [Date, Date]
		const s = a <= b ? a : b
		const e = b >= a ? b : a
		return { start: toYMD(s), end: toYMD(e) }
	}, [dates])

	// El hook ya está protegido con enabled: !!start && !!end
	const { data, error, isLoading } = useApodRange(start ?? '', end ?? '')

	useEffect(() => {
		if (data && start && end) console.log('APOD range:', { start, end, data })
	}, [data, start, end])

	useEffect(() => {
		if (error) console.error('APOD error:', error)
	}, [error])

	return (
		<div className='space-y-4'>
			{/* Header estilizado */}
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
							(Por ahora el resultado se imprime en la consola.)
						</>
					) : (
						<>
							Selecciona un <span className='font-semibold'>rango de fechas</span> para consultar la
							galería APOD de la NASA (imágenes o videos por día) y visualizar los resultados.
						</>
					)}
				</p>
			</div>

			{/* Calendario: NO se toca */}
			<Calendar
				value={dates ?? undefined}
				onChange={onChange}
				selectionMode='range'
				readOnlyInput
				hideOnRangeSelection
				dateFormat='yy-mm-dd'
				showIcon
			/>

			{/* Mensaje inferior (puedes dejarlo o quitarlo) */}
			{!start || !end ? (
				<p className='text-sm text-slate-500'>Selecciona un rango de fechas.</p>
			) : isLoading ? (
				<p className='text-sm text-slate-500'>Cargando…</p>
			) : (
				<p className='text-sm text-slate-500'>
					Revisa la consola ({start} → {end}).
				</p>
			)}
		</div>
	)
}
