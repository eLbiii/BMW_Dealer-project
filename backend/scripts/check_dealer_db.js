const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, 'backend', 'dealer.db')
const db = new sqlite3.Database(dbPath)

console.log(`Checking DB at: ${dbPath}`)

db.all('SELECT name, image FROM cars LIMIT 5', [], (err, rows) => {
	if (err) {
		console.error('Error reading DB:', err)
		return
	}
	console.log('Current Data in dealer.db:')
	console.log(JSON.stringify(rows, null, 2))
	db.close()
})
