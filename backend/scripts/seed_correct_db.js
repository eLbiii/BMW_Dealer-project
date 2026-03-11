const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// CORRECT DATABASE PATH
const dbPath = path.resolve(__dirname, 'backend', 'dealer.db')
const db = new sqlite3.Database(dbPath)

// Path to JSON data
const jsonPath = path.resolve(
	__dirname,
	'frontend',
	'src',
	'assets',
	'data',
	'cars.json',
)

if (!fs.existsSync(jsonPath)) {
	console.error('CRITICAL: cars.json not found at', jsonPath)
	process.exit(1)
}

const cars = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

db.serialize(() => {
	console.log('Migrating database to dealer.db using valid schema...')

	// Ensure cars table exists with CORRECT schema (Text PK)
	// We drop it to ensure we start fresh on a seed
	db.run('DROP TABLE IF EXISTS cars')

	db.run(
		`CREATE TABLE IF NOT EXISTS cars (
            id TEXT PRIMARY KEY,
            name TEXT,
            series TEXT,
            engine TEXT,
            condition TEXT,
            body TEXT,
            price INTEGER,
            year INTEGER,
            power TEXT,
            acceleration TEXT,
            consumption TEXT,
            transmission TEXT,
            drive TEXT,
            image TEXT,
            detail_image TEXT,
            description TEXT,
            mileage INTEGER,
            electricRange TEXT,
            range TEXT,
            model_info TEXT,
            facts TEXT,
            engine_info TEXT,
            tech_specs TEXT
        )`,
		err => {
			if (err) {
				console.error('Error creating table:', err)
				return
			}
			console.log('Cars table created (or verified).')
		},
	)

	const stmt = db.prepare(`
    INSERT INTO cars (
        id, name, series, engine, condition, body, price, year, 
        power, acceleration, consumption, transmission, drive, image, detail_image,
        description, mileage, electricRange, range, model_info, facts, engine_info, tech_specs
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

	cars.forEach(car => {
		// Ensure ID is present
		const id = car.id || Math.random().toString(36).substr(2)

		stmt.run(
			id,
			car.name,
			car.series,
			car.engine,
			car.condition,
			car.body,
			car.price,
			car.year,
			car.power,
			car.acceleration,
			car.consumption,
			car.transmission,
			car.drive,
			car.image,
			car.detail_image,
			car.description,
			car.mileage || null,
			car.electricRange || null,
			car.range || null,
			car.model_info || null,
			car.facts ? JSON.stringify(car.facts) : null,
			car.engine_info || null,
			car.tech_specs ? JSON.stringify(car.tech_specs) : null,
		)
	})

	stmt.finalize(() => {
		console.log(
			`Seeded ${cars.length} cars from JSON into dealer.db successfully.`,
		)
		db.close()
	})
})
