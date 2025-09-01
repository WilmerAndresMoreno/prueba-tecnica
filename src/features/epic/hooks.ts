import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { nasa } from '@/shared/api/nasa'
import type { EpicItem } from '@/shared/api/types/epic'
import type { HttpError } from '@/shared/api/http'

export function useEpicLatest(): UseQueryResult<EpicItem[], HttpError> {
	return useQuery({
		queryKey: ['epic', 'latest'],
		queryFn: ({ signal }) => nasa.epic.latest(signal),
		staleTime: 60_000,
	})
}

export const epicImageUrl: (date: string, image: string) => string = nasa.epic.imageUrl
