export interface RateLimitInfo {
	limit?: number
	remaining?: number
	reset?: number
}

export class HttpError extends Error {
	readonly status: number
	readonly rateLimit?: RateLimitInfo
	constructor(message: string, status: number, rateLimit?: RateLimitInfo) {
		super(message)
		this.name = 'HttpError'
		this.status = status
		this.rateLimit = rateLimit
	}
}

function toNum(x: string | null): number | undefined {
	const n = x === null ? NaN : Number(x)
	return Number.isFinite(n) ? n : undefined
}

export async function http<T>(url: string, signal?: AbortSignal): Promise<T> {
	const res = await fetch(url, { signal })
	if (!res.ok) {
		const rateLimit: RateLimitInfo = {
			limit: toNum(res.headers.get('X-RateLimit-Limit')),
			remaining: toNum(res.headers.get('X-RateLimit-Remaining')),
			reset: toNum(res.headers.get('X-RateLimit-Reset')),
		}
		throw new HttpError(`HTTP ${res.status}`, res.status, rateLimit)
	}
	return (await res.json()) as T
}
