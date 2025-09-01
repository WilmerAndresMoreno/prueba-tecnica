export interface EpicCoord {
	lat: number
	lon: number
}

export interface EpicItem {
	identifier: string
	caption: string
	image: string
	version: string
	date: string
	centroid_coordinates?: EpicCoord
}
