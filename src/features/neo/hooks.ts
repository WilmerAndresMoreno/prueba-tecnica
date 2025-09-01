import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { nasa } from '@/shared/api/nasa'
import type { NeoFeedResponse } from '@/shared/api/types/neo'
import type { HttpError } from '@/shared/api/http'

export function useNeoFeed(start: string, end: string): UseQueryResult<NeoFeedResponse, HttpError> {
	return useQuery({
		queryKey: ['neo', 'feed', start, end],
		queryFn: ({ signal }) => nasa.neo.feed(start, end, signal),
		enabled: !!start && !!end,
		staleTime: 60_000,
	})
}
