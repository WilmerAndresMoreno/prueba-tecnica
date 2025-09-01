export interface ApodItem {
	date: string
	explanation: string
	hdurl?: string
	media_type: 'image' | 'video' | string
	service_version?: string
	title: string
	url: string
	copyright?: string
}
