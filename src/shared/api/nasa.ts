import { http } from './http'
import { ENV } from '@/shared/config/env'
import type { ApodItem } from './types/apod'
import type { MarsPhotosResponse } from './types/mars'
import type { NeoFeedResponse } from './types/neo'
import type { EpicItem } from './types/epic'

const API = 'https://api.nasa.gov'
const KEY = ENV.nasaKey

export const nasa = {
	apod: {
		range: (start: string, end: string, signal?: AbortSignal) =>
			http<ApodItem[]>(`${API}/planetary/apod?start_date=${start}&end_date=${end}&api_key=${KEY}`, signal),
		byDate: (date: string, signal?: AbortSignal) =>
			http<ApodItem>(`${API}/planetary/apod?date=${date}&api_key=${KEY}`, signal),
	},
	mars: {
		photosByEarthDate: (rover: string, date: string, camera?: string, page = 1, signal?: AbortSignal) =>
			http<MarsPhotosResponse>(
				`${API}/mars-photos/api/v1/rovers/${encodeURIComponent(rover)}/photos?earth_date=${date}${
					camera ? `&camera=${camera}` : ''
				}&page=${page}&api_key=${KEY}`,
				signal
			),
		photosBySol: (rover: string, sol: number, camera?: string, page = 1, signal?: AbortSignal) =>
			http<MarsPhotosResponse>(
				`${API}/mars-photos/api/v1/rovers/${encodeURIComponent(rover)}/photos?sol=${sol}${
					camera ? `&camera=${camera}` : ''
				}&page=${page}&api_key=${KEY}`,
				signal
			),
	},
	neo: {
		feed: (start: string, end: string, signal?: AbortSignal) =>
			http<NeoFeedResponse>(`${API}/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${KEY}`, signal),
	},
	epic: {
		latest: (signal?: AbortSignal) => http<EpicItem[]>(`${API}/EPIC/api/natural/images?api_key=${KEY}`, signal),
		byDate: (date: string, signal?: AbortSignal) =>
			http<EpicItem[]>(`${API}/EPIC/api/natural/date/${date}?api_key=${KEY}`, signal),
		imageUrl: (date: string, image: string): string => {
			const day = date.split(' ')[0] ?? date
			const [Y, M, D] = day.split('-')
			return `${API}/EPIC/archive/natural/${Y}/${M}/${D}/png/${image}.png?api_key=${KEY}`
		},
	},
} as const
