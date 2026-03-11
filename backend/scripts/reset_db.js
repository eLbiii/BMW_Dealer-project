const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, 'backend', 'dealer.db')

if (fs.existsSync(dbPath)) {
	const db = new sqlite3.Database(dbPath)
	console.log(`Resetting database at: ${dbPath}`)

	db.run('DROP TABLE IF EXISTS cars', err => {
		if (err) {
			console.error('Error dropping table:', err)
		} else {
			console.log(
				"Table 'cars' dropped successfully. Server will recreate it with new schema.",
			)
		}
		db.close()
	})
} else {
	console.log('Database file not found, nothing to reset.')
}
