const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, 'backend', 'dealer.db')
const db = new sqlite3.Database(dbPath)

console.log('Checking cars table schema:')
db.all('PRAGMA table_info(cars)', [], (err, rows) => {
	if (err) console.error(err)
	else console.log(rows)

	console.log('\nChecking service_bookings table schema:')
	db.all('PRAGMA table_info(service_bookings)', [], (err, rows) => {
		if (err) console.error(err)
		else console.log(rows)

		db.close()
	})
})
