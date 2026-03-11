const db = require('./backend/database')

console.log('Triggering database initialization and migrations...')

setTimeout(() => {
	console.log('Done.')
	// We don't need to explicitly close because database.js doesn't export close,
	// but the process exit will handle it.
	process.exit(0)
}, 2000)
