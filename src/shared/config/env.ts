const { VITE_NASA_API_KEY } = import.meta.env

if (!VITE_NASA_API_KEY) {
	throw new Error('Falta VITE_NASA_API_KEY')
}

export const ENV = {
	nasaKey: VITE_NASA_API_KEY as string,
}
