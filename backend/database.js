const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, 'dealer.db')

const db = new sqlite3.Database(dbPath, err => {
	if (err) {
		console.error('Ошибка подключения к БД:', err.message)
	} else {
		console.log('Подключено к базе данных SQLite')
		initTables()
	}
})

function initTables() {
	// Basic tables
	const queries = [
		`CREATE TABLE IF NOT EXISTS service_bookings (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            name TEXT,
            phone TEXT,
            carModel TEXT,
            vin TEXT,
            serviceType TEXT,
            comment TEXT,
            email TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS testdrive_bookings (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            firstName TEXT,
            lastName TEXT,
            phone TEXT,
            email TEXT,
            carModel TEXT,
            date TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS leasing_requests (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            type TEXT, 
            companyName TEXT,
            inn TEXT,
            contactPerson TEXT,
            phone TEXT,
            email TEXT,
            model TEXT,
            initialPayment TEXT,
            term TEXT,
            name TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS credit_applications (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            price TEXT,
            initialPercentage TEXT,
            term TEXT,
            model TEXT,
            name TEXT,
            phone TEXT,
            email TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS insurance_applications (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            insuranceType TEXT,
            model TEXT,
            name TEXT,
            phone TEXT,
            email TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            status TEXT DEFAULT 'new',
            name TEXT,
            email TEXT,
            theme TEXT,
            message TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            userType TEXT DEFAULT 'client',
            carData TEXT
        )`,
	]

	// Create standard tables first
	db.serialize(() => {
		queries.forEach(query => {
			db.run(query, err => {
				if (err) console.error('Ошибка создания таблицы:', err.message)
			})
		})

		// Migration for existing users table (add carData if missing)
		db.run('ALTER TABLE users ADD COLUMN carData TEXT', err => {
			// Ignore error if column exists
		})

		// Migration for service_bookings (add email if missing)
		db.run('ALTER TABLE service_bookings ADD COLUMN email TEXT', err => {
			// Ignore error if column exists
		})

		// Create CARS table last, explicitly, with callback to ensure it exists before migration
		const createCarsTable = `CREATE TABLE IF NOT EXISTS cars (
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
        )`

		db.run(createCarsTable, err => {
			if (err) {
				console.error('Ошибка создания таблицы cars:', err.message)
			} else {
				// Now we are sure cars table exists (or error logged)
				checkAndMigrateCatalog()
			}
		})

		// Seed Reviews
		checkAndSeedFeedback()
	})
}

function checkAndSeedFeedback() {
	db.get('SELECT COUNT(*) as count FROM feedback', [], (err, row) => {
		if (!err && row && row.count === 0) {
			console.log('Seeding feedback...')

			const names = [
				'Александр',
				'Дмитрий',
				'Сергей',
				'Андрей',
				'Максим',
				'Елена',
				'Анна',
				'Мария',
				'Виктория',
				'Ольга',
				'Владимир',
				'Павел',
			]
			const lastNames = [
				'Иванов',
				'Петров',
				'Смирнов',
				'Соколов',
				'Попов',
				'Волков',
				'Михайлов',
				'Новиков',
				'Федоров',
				'Морозов',
			]
			const themes = [
				'BMW X5',
				'BMW X7',
				'BMW 3 series',
				'BMW 5 series',
				'BMW X6',
				'Сервис',
				'Покупка',
				'Тест-драйв',
				'BMW M5',
			]
			const comments = [
				'Отличный автомобиль, очень доволен!',
				'Прекрасный сервис, все быстро и качественно.',
				'Машина мечты, спасибо дилеру!',
				'Покупал в кредит, условия отличные.',
				'Проходил ТО, все понравилось.',
				'Лучший дилер BMW в городе.',
				'Очень комфортный автомобиль для дальних поездок.',
				'Динамика просто ураган!',
				'Вежливый персонал и уютная зона ожидания.',
				'Рекомендую всем, профессионалы своего дела.',
				'После Mercedes ощущения совсем другие, драйв!',
				'Взял X5, семья в восторге.',
				'Менеджеры помогли с выбором, спасибо.',
				'Качественное обслуживание и оригинальные запчасти.',
				'Тест-драйв прошел отлично, сразу заказал авто.',
			]

			const reviews = []
			for (let i = 0; i < 50; i++) {
				const name =
					names[Math.floor(Math.random() * names.length)] +
					' ' +
					lastNames[Math.floor(Math.random() * lastNames.length)]
				const theme = themes[Math.floor(Math.random() * themes.length)]
				const msg = comments[Math.floor(Math.random() * comments.length)]

				// Random date within last year
				const timeDiff = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
				const date = new Date(Date.now() - timeDiff).toISOString()

				reviews.push({
					name: name,
					email: 'client@example.com',
					theme: theme,
					message: msg,
					status: 'published',
					createdAt: date,
				})
			}

			const stmt = db.prepare(
				'INSERT INTO feedback (id, createdAt, status, name, email, theme, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
			)
			reviews.forEach(r => {
				stmt.run([
					Math.random().toString(36).substr(2, 9),
					r.createdAt,
					r.status,
					r.name,
					r.email,
					r.theme,
					r.message,
				])
			})
			stmt.finalize()
			console.log('Feedback seeded.')
		}
	})
}

function checkAndMigrateCatalog() {
	db.get('SELECT COUNT(*) as count FROM cars', [], (err, row) => {
		if (err) {
			console.error('Ошибка проверки каталога:', err)
			return
		}
		if (row && row.count === 0) {
			console.log('Таблица cars пуста. Выполняю миграцию из cars.json...')
			try {
				const jsonPath = path.join(
					__dirname,
					'../frontend/src/assets/data/cars.json',
				)
				if (fs.existsSync(jsonPath)) {
					const cars = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
					const stmt = db.prepare(
						`INSERT INTO cars (id, name, series, engine, condition, body, price, year, power, acceleration, consumption, transmission, drive, image, detail_image, description, mileage, electricRange, range, model_info, facts, engine_info, tech_specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					)

					cars.forEach(car => {
						stmt.run([
							car.id,
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
						])
					})
					stmt.finalize()
					console.log(
						`Миграция завершена. Добавлено ${cars.length} автомобилей.`,
					)
				} else {
					console.log('cars.json не найден, пропускаю миграцию.')
				}
			} catch (e) {
				console.error('Ошибка миграции каталога:', e)
			}
		}
	})
}

module.exports = db
