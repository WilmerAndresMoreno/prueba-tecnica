import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, type CalendarProps } from 'primereact/calendar'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { useQuery } from '@tanstack/react-query'

import { nasa } from '@/shared/api/nasa'
import type { NeoFeedResponse } from '@/shared/api/types/neo'

const toYMD = (d: Date) => {
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

const computeEnd = (start: Date, today: Date): Date => {
	const end = new Date(start)
	end.setDate(end.getDate() + 6)
	return end > today ? today : end
}

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

type CalendarOnChangeSingle = NonNullable<CalendarProps<'single', Date>['onChange']>
type DropdownOnChange = NonNullable<React.ComponentProps<typeof Dropdown>['onChange']>

type NEO = NeoFeedResponse['near_earth_objects'][string][number]

type Row = {
	id: string
	name: string
	hazardous: boolean
	approachDate: string
	missKm: number
	velKps: number
	diamMinM: number
	diamMaxM: number
	absMag: number
	jplUrl: string
}

export default function NeoPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const qStart = searchParams.get('start')
	const qEnd = searchParams.get('end')
	const qHaz = (searchParams.get('hazard') ?? 'all') as 'all' | 'true' | 'false'

	const [startDate, setStartDate] = useState<Date | null>(() => parseYMD(qStart))
	const onDateChange: CalendarOnChangeSingle = (e) => {
		const v = e.value
		setStartDate(v instanceof Date ? v : null)
	}

	const today = useMemo(() => {
		const t = new Date()
		t.setHours(0, 0, 0, 0)
		return t
	}, [])

	const canSearch = Boolean(startDate)
	const onSearch = () => {
		if (!startDate) return
		const s = new Date(startDate)
		s.setHours(0, 0, 0, 0)
		const e = computeEnd(s, today)
		const next = new URLSearchParams(searchParams)
		next.set('start', toYMD(s))
		next.set('end', toYMD(e))
		if (!next.get('hazard')) next.set('hazard', 'all')
		setSearchParams(next, { replace: false })
	}

	const enabled = Boolean(qStart && qEnd)
	const { data, isLoading, error } = useQuery<NeoFeedResponse, Error>({
		queryKey: ['neo', qStart, qEnd],
		queryFn: ({ signal }) => nasa.neo.feed(qStart!, qEnd!, signal),
		enabled,
		staleTime: 60_000,
	})

	const rowsAll: Row[] = useMemo(() => {
		if (!data) return []
		const entries = Object.entries(data.near_earth_objects)
		const r: Row[] = []
		for (const [, list] of entries) {
			for (const neo of list as NEO[]) {
				const approach = neo.close_approach_data?.[0]
				const missKm = approach?.miss_distance?.kilometers ? Number(approach.miss_distance.kilometers) : NaN
				const velKps = approach?.relative_velocity?.kilometers_per_second
					? Number(approach.relative_velocity.kilometers_per_second)
					: NaN
				const diamMinM = neo.estimated_diameter?.meters?.estimated_diameter_min ?? NaN
				const diamMaxM = neo.estimated_diameter?.meters?.estimated_diameter_max ?? NaN

				r.push({
					id: String(neo.id),
					name: neo.name,
					hazardous: Boolean(neo.is_potentially_hazardous_asteroid),
					approachDate: approach?.close_approach_date ?? approach?.close_approach_date ?? '',
					missKm,
					velKps,
					diamMinM,
					diamMaxM,
					absMag: neo.absolute_magnitude_h,
					jplUrl: (neo as unknown as { nasa_jpl_url?: string }).nasa_jpl_url ?? '#',
				})
			}
		}
		return r
	}, [data])

	const rows: Row[] = useMemo(() => {
		if (qHaz === 'true') return rowsAll.filter((r) => r.hazardous)
		if (qHaz === 'false') return rowsAll.filter((r) => !r.hazardous)
		return rowsAll
	}, [rowsAll, qHaz])

	type HazardOption = { label: string; value: 'all' | 'true' | 'false' }
	const hazardOptions: HazardOption[] = [
		{ label: 'Todos', value: 'all' },
		{ label: 'Solo peligrosos (true)', value: 'true' },
		{ label: 'Solo no peligrosos (false)', value: 'false' },
	]

	const onHazardChange: DropdownOnChange = (e) => {
		const next = new URLSearchParams(searchParams)
		next.set('hazard', e.value as 'all' | 'true' | 'false')
		setSearchParams(next, { replace: false })
	}

	const hazardousBody = (r: Row) =>
		r.hazardous ? (
			<Tag value='TRUE' severity='danger' aria-label='Peligroso' />
		) : (
			<Tag value='FALSE' severity='success' aria-label='No peligroso' />
		)

	const nameBody = (r: Row) => (
		<a
			href={r.jplUrl}
			target='_blank'
			rel='noreferrer'
			className='text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600'
			aria-label={`Abrir ficha de ${r.name} en una nueva pestaña`}
		>
			{r.name}
		</a>
	)

	const numberBody = (n: number, fmt: Intl.NumberFormat) => (isFinite(n) ? fmt.format(n) : '—')
	const missBody = (r: Row) => <span>{numberBody(r.missKm, nf0)} km</span>
	const velBody = (r: Row) => <span>{numberBody(r.velKps, nf2)} km/s</span>

	const header = (
		<div className='flex flex-col gap-3'>
			<div>
				<h1 className='text-2xl font-bold'>
					<span className='bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent'>
						NEO (Near-Earth Objects)
					</span>
				</h1>
				<p className='text-sm text-slate-600'>
					Selecciona el <span className='font-medium'>día inicial</span> y consultaremos automáticamente hasta
					7 días (sin superar hoy).
				</p>
			</div>

			<div className='flex flex-wrap items-end gap-3'>
				<div className='flex flex-col'>
					<label htmlFor='start' className='text-sm font-medium text-slate-900'>
						Día inicial
					</label>
					<Calendar
						id='start'
						value={startDate ?? undefined}
						onChange={onDateChange}
						dateFormat='yy-mm-dd'
						showIcon
						maxDate={today}
						placeholder='YYYY-MM-DD'
						className='w-[260px]'
						aria-describedby='start-help'
					/>
					<span id='start-help' className='text-xs text-slate-500 mt-1'>
						Calcularemos un rango de 7 días inclusive (recortado a hoy si corresponde).
					</span>
				</div>

				<Button
					label='Buscar'
					icon='pi pi-search'
					onClick={onSearch}
					disabled={!canSearch}
					aria-disabled={!canSearch}
					className='h-11'
				/>

				{qStart && qEnd && (
					<p className='text-xs text-slate-600 ml-auto'>
						Rango activo: <span className='font-medium'>{qStart}</span> →{' '}
						<span className='font-medium'>{qEnd}</span>
					</p>
				)}
			</div>
		</div>
	)

	const hazardousHeader = (
		<div className='flex items-center gap-2'>
			<span className='font-semibold'>Peligroso</span>
			<Dropdown
				value={qHaz}
				options={hazardOptions}
				onChange={onHazardChange}
				aria-label='Filtrar por peligrosidad'
				className='w-40'
			/>
		</div>
	)

	return (
		<main className='space-y-4'>
			<section aria-labelledby='neo-heading' className='rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4'>
				<h2 id='neo-heading' className='sr-only'>
					Búsqueda de objetos cercanos a la Tierra
				</h2>

				<DataTable
					value={rows}
					header={header}
					paginator
					rows={25}
					className='text-sm'
					aria-label='Tabla de objetos cercanos a la Tierra'
					emptyMessage={
						enabled
							? 'Sin resultados para el rango seleccionado.'
							: 'Selecciona el día inicial y pulsa Buscar.'
					}
					loading={isLoading}
				>
					<Column field='name' header='Nombre' body={nameBody} sortable headerClassName='text-slate-900' />
					<Column field='approachDate' header='Aproximación' sortable headerClassName='text-slate-900' />
					<Column header={hazardousHeader} body={hazardousBody} headerStyle={{ minWidth: '220px' }} />
					<Column
						field='missKm'
						header='Distancia mínima (km)'
						body={missBody}
						sortable
						headerClassName='text-slate-900'
					/>
					<Column
						field='velKps'
						header='Velocidad (km/s)'
						body={velBody}
						sortable
						headerClassName='text-slate-900'
					/>
				</DataTable>

				{error && <p className='mt-2 text-sm text-rose-600'>Error al cargar NEO: {error.message}</p>}
			</section>
		</main>
	)
}
