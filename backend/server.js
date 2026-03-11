/**
 * Основной сервер BMW Dealer Website
 * Backend на Node.js с Express и SQLite
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const db = require('./database')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Статические файлы frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// Генерация уникального ID
const generateId = () =>
	Date.now().toString(36) + Math.random().toString(36).substr(2)

// ================== HELPER FUNCTIONS ==================

const run = (query, params = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, params, function (err) {
			if (err) reject(err)
			else resolve(this)
		})
	})
}

const get = (query, params = []) => {
	return new Promise((resolve, reject) => {
		db.all(query, params, (err, rows) => {
			if (err) reject(err)
			else resolve(rows)
		})
	})
}

// ================== API ROUTES ==================

// --- Запись на ТО ---
app.post('/api/service', async (req, res) => {
	try {
		const { name, phone, serviceType, comment, vin, email } = req.body
		const carModel = req.body.carModel || ''
		const id = generateId()
		const createdAt = new Date().toISOString()

		await run(
			`INSERT INTO service_bookings (id, createdAt, status, name, phone, carModel, serviceType, comment, vin, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				createdAt,
				'new',
				name,
				phone,
				carModel,
				serviceType,
				comment,
				vin,
				email,
			],
		)

		res.json({
			success: true,
			message: 'Заявка на ТО отправлена',
			data: { id },
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/service', async (req, res) => {
	try {
		const data = await get(
			'SELECT * FROM service_bookings ORDER BY createdAt DESC',
		)
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/service/:id', async (req, res) => {
	try {
		await run('DELETE FROM service_bookings WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Запись удалена' })
	} catch (error) {
		console.error('Delete Service Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Тест-драйв ---
app.post('/api/testdrive', async (req, res) => {
	try {
		const { firstName, lastName, phone, email, carModel } = req.body
		const id = generateId()
		const createdAt = new Date().toISOString()
		const name = `${firstName} ${lastName}`
		const date = new Date().toISOString() // Placeholder currently

		await run(
			`INSERT INTO testdrive_bookings (id, createdAt, status, firstName, lastName, phone, email, carModel, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[id, createdAt, 'new', firstName, lastName, phone, email, carModel, date],
		)

		res.json({
			success: true,
			message: 'Заявка на тест-драйв отправлена',
			data: { id },
		})
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/testdrive', async (req, res) => {
	try {
		// Map fields to match frontend expectation (name combination)
		const rows = await get(
			'SELECT * FROM testdrive_bookings ORDER BY createdAt DESC',
		)
		const data = rows.map(r => ({ ...r, name: `${r.firstName} ${r.lastName}` }))
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/testdrive/:id', async (req, res) => {
	try {
		await run('DELETE FROM testdrive_bookings WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Запись удалена' })
	} catch (error) {
		console.error('Delete Testdrive Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Лизинг ---
app.post('/api/leasing', async (req, res) => {
	try {
		// Handle both Individual and Corporate fields
		const {
			type,
			companyName,
			inn,
			contactPerson,
			name,
			phone,
			email,
			model,
			initialPayment,
			term,
		} = req.body
		const id = generateId()
		const createdAt = new Date().toISOString()

		await run(
			`INSERT INTO leasing_requests (id, createdAt, status, type, companyName, inn, contactPerson, name, phone, email, model, initialPayment, term) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				createdAt,
				'new',
				type,
				companyName,
				inn,
				contactPerson,
				name,
				phone,
				email,
				model,
				initialPayment,
				term,
			],
		)

		res.json({
			success: true,
			message: 'Заявка на лизинг отправлена',
			data: { id },
		})
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/leasing', async (req, res) => {
	try {
		const data = await get(
			'SELECT * FROM leasing_requests ORDER BY createdAt DESC',
		)
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/leasing/:id', async (req, res) => {
	try {
		await run('DELETE FROM leasing_requests WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Заявка удалена' })
	} catch (error) {
		console.error('Delete Leasing Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Кредит ---
app.post('/api/credit', async (req, res) => {
	try {
		const { price, initialPercentage, term, model, name, phone, email } =
			req.body
		const id = generateId()
		const createdAt = new Date().toISOString()

		await run(
			`INSERT INTO credit_applications (id, createdAt, status, price, initialPercentage, term, model, name, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				createdAt,
				'new',
				price,
				initialPercentage,
				term,
				model,
				name,
				phone,
				email,
			],
		)

		res.json({
			success: true,
			message: 'Заявка на кредит отправлена',
			data: { id },
		})
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/credit', async (req, res) => {
	try {
		const data = await get(
			'SELECT * FROM credit_applications ORDER BY createdAt DESC',
		)
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/credit/:id', async (req, res) => {
	try {
		await run('DELETE FROM credit_applications WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Заявка удалена' })
	} catch (error) {
		console.error('Delete Credit Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Страхование ---
app.post('/api/insurance', async (req, res) => {
	try {
		const { insuranceType, model, name, phone, email } = req.body
		const id = generateId()
		const createdAt = new Date().toISOString()

		await run(
			`INSERT INTO insurance_applications (id, createdAt, status, insuranceType, model, name, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[id, createdAt, 'new', insuranceType, model, name, phone, email],
		)

		res.json({
			success: true,
			message: 'Заявка на страхование отправлена',
			data: { id },
		})
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/insurance', async (req, res) => {
	try {
		const data = await get(
			'SELECT * FROM insurance_applications ORDER BY createdAt DESC',
		)
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/insurance/:id', async (req, res) => {
	try {
		await run('DELETE FROM insurance_applications WHERE id = ?', [
			req.params.id,
		])
		res.json({ success: true, message: 'Заявка удалена' })
	} catch (error) {
		console.error('Delete Insurance Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Обратная связь ---
app.post('/api/feedback', async (req, res) => {
	try {
		const { name, email, theme, message } = req.body
		const id = generateId()
		const createdAt = new Date().toISOString()

		await run(
			`INSERT INTO feedback (id, createdAt, status, name, email, theme, message) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[id, createdAt, 'new', name, email, theme, message],
		)

		res.json({ success: true, message: 'Сообщение отправлено', data: { id } })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.get('/api/feedback', async (req, res) => {
	try {
		const data = await get('SELECT * FROM feedback ORDER BY createdAt DESC')
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/feedback/:id', async (req, res) => {
	try {
		await run('DELETE FROM feedback WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Отзыв удален' })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Админ авторизация ---
app.post('/api/admin/login', (req, res) => {
	const { username, password } = req.body
	if (username === 'admin' && password === 'admin123') {
		res.json({ success: true, message: 'Вход выполнен' })
	} else {
		res.status(401).json({ success: false, message: 'Неверные данные' })
	}
})

// --- Обновление полей (Admin) ---
app.put('/api/admin/:type/:id', async (req, res) => {
	try {
		const { type, id } = req.params
		const body = req.body
		delete body.id // Don't update ID
		delete body.type

		const tableMap = {
			service: 'service_bookings',
			testdrive: 'testdrive_bookings',
			leasing: 'leasing_requests',
			credit: 'credit_applications',
			insurance: 'insurance_applications',
			feedback: 'feedback',
			cars: 'cars',
		}

		if (!tableMap[type]) {
			return res.status(400).json({ success: false, message: 'Неверный тип' })
		}

		// Dynamically build UPDATE query
		const keys = Object.keys(body)
		const updates = keys.map(key => `${key} = ?`).join(', ')
		const values = keys.map(key => body[key])
		values.push(id) // Add ID for WHERE clause

		const query = `UPDATE ${tableMap[type]} SET ${updates} WHERE id = ?`

		await run(query, values)

		res.json({ success: true, message: 'Запись обновлена' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Регистрация пользователя ---
app.post('/api/register', async (req, res) => {
	try {
		const { userType, email, password, phone } = req.body
		// Basic validation
		if (!email || !password) {
			return res
				.status(400)
				.json({ success: false, message: 'Email и пароль обязательны' })
		}

		// Check if user exists
		const existing = await get('SELECT id FROM users WHERE email = ?', [email])
		if (existing && existing.length > 0) {
			return res.status(400).json({
				success: false,
				message: 'Пользователь с таким Email уже существует',
			})
		}

		const id = generateId()
		const createdAt = new Date().toISOString()

		// Determine Name based on type
		let name = ''
		if (userType === 'individual') {
			name = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim()
		} else if (userType === 'legal') {
			name = req.body.companyName || 'Компания'
			// We might want to store INN etc, but current schema is simple.
			// Ideally we'd extend schema or store JSON in a field, but 'name' is sufficient for display.
		} else {
			name = 'Пользователь'
		}

		await run(
			'INSERT INTO users (id, createdAt, name, email, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
			[id, createdAt, name, email, password, userType || 'client'],
		)

		res.json({
			success: true,
			message: 'Регистрация успешна! Теперь вы можете войти.',
		})
	} catch (error) {
		console.error('Registration Error:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Вход (Login) ---
app.post('/api/login', async (req, res) => {
	try {
		const { login, password } = req.body // login can be email

		const user = await get(
			'SELECT * FROM users WHERE email = ? AND password = ?',
			[login, password],
		)

		if (user && user.length > 0) {
			const userData = user[0]
			delete userData.password // Don't send password back
			res.json({ success: true, user: userData })
		} else {
			res
				.status(401)
				.json({ success: false, message: 'Неверный E-mail или пароль' })
		}
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- User Profile Endpoints ---

// Update Car Data
app.post('/api/user/update', async (req, res) => {
	try {
		const { id, carData } = req.body
		await run('UPDATE users SET carData = ? WHERE id = ?', [
			JSON.stringify(carData),
			id,
		])
		res.json({ success: true, message: 'Данные автомобиля обновлены' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// Get User Requests
app.get('/api/user/requests', async (req, res) => {
	try {
		const { email } = req.query
		if (!email) return res.json({ success: false, data: [] })

		// Aggregate from all tables
		const service = await get(
			'SELECT *, "service" as type FROM service_bookings WHERE email = ? OR phone LIKE ?',
			[email, `%${email}%`],
		) // Try precise email match first, or phone if email is actually a phone (some legacy logic maybe)
		// Better: Assuming 'email' column exists in all request tables, which they do mostly.
		// Let's use exact email match where possible.

		// Tables:
		// service_bookings: name, phone (no email?) -> Checking database.js... service_bookings has NO email. It has phone. We'll match by name? Or we should have asked phone in login.
		// Let's assume user provides phone in profile and we match by that too.
		// For now, let's try to match by what we have.

		// Leasing has email.
		const leasing = await get(
			'SELECT *, "leasing" as type FROM leasing_requests WHERE email = ?',
			[email],
		)
		// Testdrive has email.
		const testdrive = await get(
			'SELECT *, "testdrive" as type FROM testdrive_bookings WHERE email = ?',
			[email],
		)
		// Credit has email.
		const credit = await get(
			'SELECT *, "credit" as type FROM credit_applications WHERE email = ?',
			[email],
		)
		// Insurance has email.
		const insurance = await get(
			'SELECT *, "insurance" as type FROM insurance_applications WHERE email = ?',
			[email],
		)

		// Feedback has email.
		const feedback = await get(
			'SELECT *, "feedback" as type FROM feedback WHERE email = ?',
			[email],
		)

		const all = [...leasing, ...testdrive, ...credit, ...insurance, ...feedback]

		// Sort by date
		all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

		res.json({ success: true, data: all })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Пользователи (Admin) ---
app.get('/api/users', async (req, res) => {
	try {
		const users = await get(
			'SELECT id, name, email, userType, createdAt FROM users',
		)
		res.json({ success: true, data: users })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/users/:id', async (req, res) => {
	try {
		await run('DELETE FROM users WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Пользователь удален' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Публичные отзывы (Только опубликованные) ---
app.get('/api/feedback/public', async (req, res) => {
	try {
		const data = await get(
			"SELECT * FROM feedback WHERE status = 'published' ORDER BY createdAt DESC",
		)
		res.json({ success: true, data })
	} catch (error) {
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// --- Каталог автомобилей (DB) ---
app.get('/api/cars', async (req, res) => {
	try {
		const { condition } = req.query
		let query = 'SELECT * FROM cars'
		let params = []

		if (condition) {
			query += ' WHERE condition = ?'
			params.push(condition)
		}

		query += ' ORDER BY price DESC'

		const cars = await get(query, params)
		res.json({ success: true, data: cars })
	} catch (error) {
		console.error('Ошибка получения каталога:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.post('/api/cars', async (req, res) => {
	try {
		const car = req.body
		const id = car.id || generateId() // Allow client to send ID or generate one
		const createdAt = new Date().toISOString()

		// Define all fields explicitly to avoid SQL injection on keys (though run() uses params)
		// and handle optional fields.
		const query = `INSERT INTO cars (id, name, series, engine, condition, body, price, year, power, acceleration, consumption, transmission, drive, image, description, mileage, electricRange, range) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		const values = [
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
			car.description,
			car.mileage || null,
			car.electricRange || null,
			car.range || null,
		]

		await run(query, values)
		res.json({ success: true, message: 'Автомобиль добавлен', data: { id } })
	} catch (error) {
		console.error('Ошибка добавления авто:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

app.delete('/api/cars/:id', async (req, res) => {
	try {
		await run('DELETE FROM cars WHERE id = ?', [req.params.id])
		res.json({ success: true, message: 'Автомобиль удален' })
	} catch (error) {
		console.error('Ошибка удаления авто:', error)
		res.status(500).json({ success: false, message: 'Ошибка сервера' })
	}
})

// Глобальный обработчик HTML страниц
app.get('*', (req, res) => {
	const urlPath = req.path
	if (urlPath.endsWith('.html')) {
		const htmlPath = path.join(__dirname, '../frontend', urlPath)
		if (fs.existsSync(htmlPath)) {
			return res.sendFile(htmlPath)
		}
	}
	res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

app.listen(PORT, () => {
	console.log(
		`🚗 BMW Dealer Server (SQLite) запущен на http://localhost:${PORT}`,
	)
})
