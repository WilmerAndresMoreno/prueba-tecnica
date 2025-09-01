import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { nasa } from '@/shared/api/nasa'
import type { ApodItem } from '@/shared/api/types/apod'
import type { HttpError } from '@/shared/api/http'

export function useApodRange(start: string, end: string): UseQueryResult<ApodItem[], HttpError> {
	return useQuery({
		queryKey: ['apod', 'range', start, end],
		queryFn: ({ signal }) => nasa.apod.range(start, end, signal),
		enabled: !!start && !!end,
		staleTime: 60_000,
	})
}

export function useApodByDate(date: string): UseQueryResult<ApodItem, HttpError> {
	return useQuery({
		queryKey: ['apod', 'byDate', date],
		queryFn: ({ signal }) => nasa.apod.byDate(date, signal),
		enabled: !!date,
		staleTime: 60_000,
	})
}
