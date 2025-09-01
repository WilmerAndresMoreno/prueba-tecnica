export default function NotFound() {
	return (
		<>
			<div className='min-h-[60vh] flex items-center justify-center p-6'>
				<img
					src='/404.svg'
					alt='Página no encontrada (error 404)'
					className='max-w-[580px] w-full h-auto'
					loading='eager'
					decoding='async'
				/>
			</div>
		</>
	)
}
