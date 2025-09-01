import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'

function getHttpStatus(error: unknown): number {
	if (typeof error === 'object' && error !== null && 'status' in error) {
		const status = (error as { status?: unknown }).status
		return typeof status === 'number' ? status : 0
	}
	return 0
}

export function QueryProvider({ children }: { children: ReactNode }) {
	const client = useMemo(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5,
						refetchOnWindowFocus: false,
						retry(failureCount: number, error: unknown) {
							if (failureCount >= 2) return false
							const status = getHttpStatus(error)
							return status >= 500 || status === 429
						},
					},
				},
			}),
		[]
	)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
