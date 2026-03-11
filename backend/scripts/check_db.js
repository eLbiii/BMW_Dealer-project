const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, 'backend', 'database.sqlite')
const db = new sqlite3.Database(dbPath)

db.all(
	'SELECT name, image, detail_image FROM cars LIMIT 5',
	[],
	(err, rows) => {
		if (err) {
			console.error(err)
			return
		}
		console.log(JSON.stringify(rows, null, 2))
		db.close()
	},
)
