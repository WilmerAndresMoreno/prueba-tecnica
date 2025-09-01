export interface MarsCamera {
	id: number
	name: string
	rover_id: number
	full_name: string
}

export interface MarsRover {
	id: number
	name: string
	landing_date: string
	launch_date: string
	status: 'active' | 'complete' | string
}

export interface MarsPhoto {
	id: number
	sol: number
	camera: MarsCamera
	img_src: string
	earth_date: string
	rover: MarsRover
}

export interface MarsPhotosResponse {
	photos: MarsPhoto[]
}
