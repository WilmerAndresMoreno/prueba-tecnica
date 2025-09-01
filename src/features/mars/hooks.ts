import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { nasa } from '@/shared/api/nasa'
import type { MarsPhotosResponse } from '@/shared/api/types/mars'
import type { HttpError } from '@/shared/api/http'

export function useMarsEarthDate(
	rover: string,
	date: string,
	camera?: string,
	page = 1
): UseQueryResult<MarsPhotosResponse, HttpError> {
	return useQuery({
		queryKey: ['mars', 'earth', rover, date, camera, page],
		queryFn: ({ signal }) => nasa.mars.photosByEarthDate(rover, date, camera, page, signal),
		enabled: !!rover && !!date,
		staleTime: 60_000,
	})
}

export function useMarsSol(
	rover: string,
	sol: number,
	camera?: string,
	page = 1
): UseQueryResult<MarsPhotosResponse, HttpError> {
	return useQuery({
		queryKey: ['mars', 'sol', rover, sol, camera, page],
		queryFn: ({ signal }) => nasa.mars.photosBySol(rover, sol, camera, page, signal),
		enabled: !!rover && Number.isFinite(sol),
		staleTime: 60_000,
	})
}
