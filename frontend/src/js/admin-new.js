/**
 * BMW Admin Panel Logic (New Premium Version)
 * Modules: Dashboard, Catalog, Requests (All Types), Feedback, Users
 */

const API = {
	LOGIN: '/api/admin/login',
	UPDATE: '/api/admin', // + /:type/:id
	CARS: '/api/cars', // + /:id for DELETE
	USERS: '/api/users', // + /:id for DELETE
	SERVICE: '/api/service',
	TESTDRIVE: '/api/testdrive',
	LEASING: '/api/leasing',
	CREDIT: '/api/credit',
	INSURANCE: '/api/insurance',
	FEEDBACK: '/api/feedback',
}

// Global State
window.appData = {
	cars: [],
	service: [],
	testdrive: [],
	leasing: [],
	credit: [],
	insurance: [],
	feedback: [],
	users: [],
}

// Pagination State
const PAGINATION = {
	PER_PAGE: 10,
	cars: 1,
	service: 1,
	testdrive: 1,
	leasing: 1,
	credit: 1,
	insurance: 1,
	feedback: 1,
	users: 1,
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
	checkAuth()
	setupNavigation()
	setupLogin()
})

function checkAuth() {
	const isAuth = localStorage.getItem('bmw_admin_auth') === 'true'
	const overlay = document.getElementById('loginOverlay')
	if (overlay) {
		overlay.style.display = isAuth ? 'none' : 'flex'
		if (isAuth) loadAllData()
	}
}

function setupLogin() {
	const form = document.getElementById('loginForm')
	if (form) {
		form.addEventListener('submit', async e => {
			e.preventDefault()
			const formData = new FormData(form)
			const data = Object.fromEntries(formData.entries())

			try {
				const res = await fetch(API.LOGIN, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				})
				const result = await res.json()

				if (result.success) {
					localStorage.setItem('bmw_admin_auth', 'true')
					document.getElementById('loginOverlay').style.display = 'none'
					loadAllData()
				} else {
					alert('Ошибка: ' + (result.message || 'Неверные данные'))
				}
			} catch (err) {
				console.error(err)
				alert('Ошибка соединения')
			}
		})
	}

	const logout = document.getElementById('logoutBtn')
	if (logout) {
		logout.addEventListener('click', () => {
			localStorage.removeItem('bmw_admin_auth')
			location.reload()
		})
	}
}

function setupNavigation() {
	// Main Tabs
	document.querySelectorAll('.nav-item').forEach(btn => {
		btn.addEventListener('click', () => {
			// UI Toggle
			document
				.querySelectorAll('.nav-item')
				.forEach(b => b.classList.remove('active'))
			btn.classList.add('active')

			document
				.querySelectorAll('.view-section')
				.forEach(s => s.classList.remove('active'))
			const target = document.getElementById(btn.dataset.tab)
			if (target) target.classList.add('active')
		})
	})

	// Sub Tabs (Requests)
	document.querySelectorAll('.sub-tab').forEach(btn => {
		btn.addEventListener('click', () => {
			document
				.querySelectorAll('.sub-tab')
				.forEach(b => b.classList.remove('active'))
			btn.classList.add('active')
			renderRequests(btn.dataset.type)
		})
	})

	// Modal Form
	const modalForm = document.getElementById('modalForm')
	if (modalForm) {
		modalForm.addEventListener('submit', handleSave)
	}
}

// --- DATA LOADING ---
async function loadAllData() {
	await Promise.all([
		load(API.CARS, 'cars'),
		load(API.SERVICE, 'service'),
		load(API.TESTDRIVE, 'testdrive'),
		load(API.LEASING, 'leasing'),
		load(API.CREDIT, 'credit'),
		load(API.INSURANCE, 'insurance'),
		load(API.FEEDBACK, 'feedback'),
		load(API.USERS, 'users'),
	])

	updateDashboard()
	renderCatalog()
	renderRequests('service') // Default tab
	renderFeedback()
	renderUsers()
}

async function load(url, key) {
	try {
		const res = await fetch(url)
		const json = await res.json()
		if (json.success) {
			window.appData[key] = json.data || []
		}
	} catch (e) {
		console.error(`Error loading ${key}:`, e)
	}
}

// --- RENDERING ---

function updateDashboard() {
	// Calculate totals
	const totalRequests =
		(window.appData.service?.length || 0) +
		(window.appData.testdrive?.length || 0) +
		(window.appData.leasing?.length || 0) +
		(window.appData.credit?.length || 0) +
		(window.appData.insurance?.length || 0)

	document.getElementById('statRequests').textContent = totalRequests
	document.getElementById('statCars').textContent =
		window.appData.cars?.length || 0
	document.getElementById('statUsers').textContent =
		window.appData.users?.length || 0
}

function renderCatalog() {
	const list = document.getElementById('catalogList')
	if (!list) return

	const data = window.appData.cars || []

	// Pagination
	const page = PAGINATION.cars
	const limit = PAGINATION.PER_PAGE
	const totalPages = Math.ceil(data.length / limit)
	if (PAGINATION.cars > totalPages) PAGINATION.cars = totalPages || 1

	const start = (PAGINATION.cars - 1) * limit
	const end = start + limit
	const items = data.slice(start, end)

	list.innerHTML = items
		.map(
			car => `
        <tr>
            <td><img src="../src/assets/images/cars/${car.image}" style="width: 60px; height: 40px; border-radius: 4px;"></td>
            <td><strong>${car.name}</strong><br><small class="text-muted">${car.series}</small></td>
            <td>${formatPrice(car.price)}</td>
            <td>${car.engine || '-'}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="openCarModal('${car.id}')">Изменить</button>
            </td>
        </tr>
    `,
		)
		.join('')

	renderAdminPagination(
		'catalogPagination',
		'catalog',
		totalPages,
		PAGINATION.cars,
		p => {
			PAGINATION.cars = p
			renderCatalog()
		},
	)
}

function renderRequests(type) {
	const list = document.getElementById('requestsList')
	const head = document.getElementById('requestsHeader')
	if (!list || !head) return

	const data = window.appData[type] || []

	// Dynamic Header
	let headers = `<th>Дата</th><th>Клиент</th><th>Статус</th><th>Действия</th>`
	if (type === 'service')
		headers = `<th>Дата</th><th>Авто</th><th>Услуга</th><th>Клиент</th><th>Статус</th><th>Действия</th>`
	if (type === 'testdrive')
		headers = `<th>Дата</th><th>Авто</th><th>Дата Т-Д</th><th>Клиент</th><th>Статус</th><th>Действия</th>`

	head.innerHTML = headers

	// Pagination
	const page = PAGINATION[type] || 1
	const limit = PAGINATION.PER_PAGE
	const totalPages = Math.ceil(data.length / limit)
	if (page > totalPages) PAGINATION[type] = totalPages || 1

	const start = (PAGINATION[type] - 1) * limit
	const end = start + limit
	const items = data.slice(start, end)

	list.innerHTML = items
		.map(item => {
			let rows = ''
			if (type === 'service') {
				rows = `
                <td>${item.carModel || '-'}</td>
                <td>${item.serviceType || '-'}</td>
            `
			} else if (type === 'testdrive') {
				rows = `
                <td>${item.carModel || '-'}</td>
                <td>${formatDate(item.date)}</td>
            `
			} // others generic

			return `
        <tr>
            <td>${formatDate(item.createdAt)}</td>
            ${rows}
            <td>
                <div>${item.name || item.contactPerson || '-'}</div>
                <small class="text-muted">${item.phone || item.email || ''}</small>
            </td>
            <td><span class="status-badge status-${item.status || 'new'}">${item.status || 'new'}</span></td>
            <td>
                <button class="btn-sm btn-primary" onclick="openEditModal('${type}', '${item.id}')">Открыть</button>
            </td>
        </tr>
        `
		})
		.join('')

	renderAdminPagination(
		'requestsPagination',
		'requests',
		totalPages,
		PAGINATION[type],
		p => {
			PAGINATION[type] = p
			renderRequests(type)
		},
	)
}

function renderFeedback() {
	const list = document.getElementById('feedbackList')
	if (!list) return

	const data = window.appData.feedback || []

	// Pagination
	const page = PAGINATION.feedback
	const limit = PAGINATION.PER_PAGE
	const totalPages = Math.ceil(data.length / limit)
	if (PAGINATION.feedback > totalPages) PAGINATION.feedback = totalPages || 1

	const start = (PAGINATION.feedback - 1) * limit
	const end = start + limit
	const items = data.slice(start, end)

	list.innerHTML = items
		.map(
			item => `
        <tr>
            <td>${formatDate(item.createdAt)}</td>
            <td>${item.name}<br><small class="text-muted">${item.email}</small></td>
            <td title="${item.message}">${item.message ? item.message.substring(0, 50) + '...' : '-'}</td>
            <td>
                <span class="status-badge status-${item.status || 'new'}">${item.status === 'published' ? 'PUB' : item.status || 'NEW'}</span>
            </td>
            <td>
                <button class="btn-sm btn-primary" onclick="openEditModal('feedback', '${item.id}')">Управление</button>
            </td>
        </tr>
    `,
		)
		.join('')

	renderAdminPagination(
		'feedbackPagination',
		'feedback',
		totalPages,
		PAGINATION.feedback,
		p => {
			PAGINATION.feedback = p
			renderFeedback()
		},
	)
}

function renderUsers() {
	const list = document.getElementById('usersList')
	if (!list) return

	const data = window.appData.users || []

	// Pagination
	const page = PAGINATION.users
	const limit = PAGINATION.PER_PAGE
	const totalPages = Math.ceil(data.length / limit)
	if (PAGINATION.users > totalPages) PAGINATION.users = totalPages || 1

	const start = (PAGINATION.users - 1) * limit
	const end = start + limit
	const items = data.slice(start, end)

	list.innerHTML = items
		.map(
			u => `
        <tr>
            <td>${formatDate(u.createdAt)}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.userType}</td>
            <td>
                <button class="btn-sm btn-danger" onclick="deleteUser('${u.id}')">Удалить</button>
            </td>
        </tr>
    `,
		)
		.join('')

	renderAdminPagination(
		'usersPagination',
		'users',
		totalPages,
		PAGINATION.users,
		p => {
			PAGINATION.users = p
			renderUsers()
		},
	)
}

// Helper: Admin Pagination Controls
function renderAdminPagination(
	containerId,
	sectionId,
	totalPages,
	curPage,
	onPageChange,
) {
	let container = document.getElementById(containerId)
	if (!container) {
		// Find section to start with
		// Since we are creating dynamic IDs, we need to append them to the relevant section container
		// Usually, these lists are inside a .table-wrapper or at the bottom of the section
		const section = document.getElementById(sectionId) // e.g. 'catalog', 'feedback'
		if (section) {
			container = document.createElement('div')
			container.id = containerId
			container.style.display = 'flex'
			container.style.justifyContent = 'center'
			container.style.marginTop = '1rem'
			container.style.marginBottom = '2rem'
			container.style.gap = '5px'
			section.appendChild(container)
		}
	}

	if (!container) return

	if (totalPages <= 1) {
		container.innerHTML = ''
		return
	}

	let html = ''
	const globalCbName = `cb_${containerId}`
	window[globalCbName] = onPageChange

	for (let i = 1; i <= totalPages; i++) {
		const style =
			i === curPage
				? 'background: var(--bmw-blue-primary); color: #fff; border: none; font-weight: bold;'
				: 'background: #333; color: #ccc; border: 1px solid #444;'

		html += `<button onclick="window['${globalCbName}'](${i})" 
                style="padding: 5px 12px; border-radius: 4px; cursor: pointer; ${style}">${i}</button>`
	}
	container.innerHTML = html
}

// --- MODALS & EDITING ---

// Generic Edit Modal for Requests & Feedback
window.openEditModal = function (type, id) {
	const item = window.appData[type].find(i => i.id == id)
	if (!item) return

	setupModalInputs(type, item)

	document.getElementById('modalTitle').textContent =
		type === 'feedback' ? 'Отзыв' : 'Заявка'
	document.getElementById('modal').classList.add('active')
}

// Car Modal (Add/Edit)
window.openCarModal = function (id = null) {
	let item = {}
	if (id) {
		item = window.appData.cars.find(c => c.id === id) || {}
	}

	document.getElementById('modalId').value = id || ''
	document.getElementById('modalType').value = 'cars'

	const container = document.getElementById('modalFields')

	// Options
	const bodies = [
		{ value: 'sedan', text: 'Седан' },
		{ value: 'coupe', text: 'Купе' },
		{ value: 'wagon', text: 'Универсал' },
		{ value: 'crossover', text: 'Кроссовер' },
		{ value: 'convertible', text: 'Кабриолет' },
		{ value: 'hatchback', text: 'Хэтчбек' },
	]
	const engines = [
		{ value: 'petrol', text: 'Бензин' },
		{ value: 'diesel', text: 'Дизель' },
		{ value: 'electric', text: 'Электро' },
		{ value: 'hybrid', text: 'Гибрид' },
	]
	const transmissions = [
		{ value: 'Автомат', text: 'Автомат' },
		{ value: 'Механика', text: 'Механика' },
		{ value: 'Робот', text: 'Робот' },
	]
	const drives = [
		{ value: 'Полный', text: 'Полный' },
		{ value: 'Задний', text: 'Задний' },
		{ value: 'Передний', text: 'Передний' },
	]

	container.innerHTML = `
        <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; font-size:1.1em; color:#ddd;">Основные данные</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${createInput('name', 'Название модели', item.name, 'text', 'BMW X5')}
            ${createInput('series', 'Серия', item.series, 'text', 'X5')}
            ${createInput('price', 'Цена (₽)', item.price, 'number')}
            ${createInput('year', 'Год выпуска', item.year || new Date().getFullYear(), 'number')}
        </div>

        <h3 style="margin-top:20px; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; font-size:1.1em; color:#ddd;">Характеристики</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${createSelect('body', 'Кузов', item.body, bodies)}
            ${createSelect('engine', 'Тип двигателя', item.engine, engines)}
            ${createSelect('transmission', 'Коробка передач', item.transmission, transmissions)}
            ${createSelect('drive', 'Привод', item.drive, drives)}
            
            ${createInput('power', 'Мощность (л.с.)', item.power)}
            ${createInput('acceleration', 'Разгон 0-100 (сек)', item.acceleration)}
            ${createInput('consumption', 'Расход/Запас хода', item.consumption)}
        </div>

        <h3 style="margin-top:20px; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; font-size:1.1em; color:#ddd;">Медиа и Описание</h3>
        ${createInput('image', 'Имя файла фото (в assets/images/cars)', item.image)}
        <div class="form-group">
            <label class="form-label">Описание</label>
            <textarea name="description" class="form-control" rows="3" placeholder="Краткое описание авто">${item.description || ''}</textarea>
        </div>
    `

	document.getElementById('modalTitle').textContent = id
		? 'Редактировать автомобиль'
		: 'Добавить автомобиль'
	document.getElementById('modalDeleteBtn').style.display = id
		? 'block'
		: 'none'
	document.getElementById('modal').classList.add('active')
}

function setupModalInputs(type, item) {
	document.getElementById('modalId').value = item.id
	document.getElementById('modalType').value = type
	document.getElementById('modalDeleteBtn').style.display = 'block'

	const container = document.getElementById('modalFields')
	let html = ''

	// Status Select
	if (type === 'feedback') {
		html += `
            <div class="form-group">
                <label class="form-label">Статус публикации</label>
                <select name="status" class="form-control">
                    <option value="new" ${item.status === 'new' ? 'selected' : ''}>Новый (Скрыт)</option>
                    <option value="published" ${item.status === 'published' ? 'selected' : ''}>Опубликован (Виден)</option>
                </select>
            </div>
            <p style="color: #fff; margin-bottom: 1rem;">${item.message}</p>
        `
	} else {
		html += `
            <div class="form-group">
                <label class="form-label">Статус заявки</label>
                <select name="status" class="form-control">
                    <option value="new" ${item.status === 'new' ? 'selected' : ''}>Новая</option>
                    <option value="processing" ${item.status === 'processing' ? 'selected' : ''}>В работе</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Отменена</option>
                </select>
            </div>
        `
		// Read-only info
		html += `<div style="background: #111; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">`
		for (const [key, val] of Object.entries(item)) {
			if (['id', 'createdAt', 'status'].includes(key)) continue
			html += `<div style="margin-bottom: 5px;"><strong style="color: #888;">${key}:</strong> ${val}</div>`
		}
		html += `</div>`
	}

	container.innerHTML = html
}

// Actions
window.handleSave = async function (e) {
	e.preventDefault()
	const formData = new FormData(e.target)
	const data = Object.fromEntries(formData.entries())
	const id = data.id
	const type = data.type

	let url = type === 'cars' && !id ? API.CARS : `${API.UPDATE}/${type}/${id}`
	let method = type === 'cars' && !id ? 'POST' : 'PUT'

	if (type === 'cars' && !id) delete data.id // remove empty ID for create

	try {
		const res = await fetch(url, {
			method: method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
		const result = await res.json()

		if (result.success) {
			closeModal()
			loadAllData() // Refresh everything
		} else {
			alert('Ошибка: ' + result.message)
		}
	} catch (err) {
		console.error(err)
		alert('Ошибка сохранения')
	}
}

// --- DELETE MODAL LOGIC ---
let deleteTarget = null // { type, id }

window.deleteItem = function () {
	// Вместо confirm() открываем наш красивый модал
	const id = document.getElementById('modalId').value
	const type = document.getElementById('modalType').value

	if (!id || !type) return

	deleteTarget = { type, id }
	document.getElementById('deleteModal').classList.add('active')
}

window.closeDeleteModal = function () {
	document.getElementById('deleteModal').classList.remove('active')
	deleteTarget = null
}

// Привязываем кнопку "Удалить" внутри модалки удаления
document
	.getElementById('confirmDeleteAction')
	.addEventListener('click', async () => {
		if (!deleteTarget) return

		const { type, id } = deleteTarget
		let url = ''
		if (type === 'cars') url = `/api/cars/${id}`
		else url = `/api/${type}/${id}`

		const btn = document.getElementById('confirmDeleteAction')
		const originalText = btn.textContent
		btn.textContent = 'Удаление...'

		try {
			const res = await fetch(url, { method: 'DELETE' })
			const result = await res.json()

			if (result.success) {
				closeDeleteModal()
				closeModal()
				loadAllData()
				showAdminToast('success', 'Удалено', 'Элемент успешно удален из базы.')
			} else {
				showAdminToast('error', 'Ошибка', result.message)
			}
		} catch (err) {
			console.error(err)
			showAdminToast('error', 'Ошибка сети', 'Не удалось удалить элемент.')
		} finally {
			btn.textContent = originalText
		}
	})

window.deleteUser = function (id) {
	deleteTarget = { type: 'users', id }
	document.getElementById('deleteModal').classList.add('active')
}

window.closeModal = function () {
	document.getElementById('modal').classList.remove('active')
}

/**
 * Toast Notifications for Admin
 */
window.showAdminToast = function (type, title, message) {
	let container = document.getElementById('toastContainer')
	if (!container) {
		const c = document.createElement('div')
		c.id = 'toastContainer'
		c.className = 'toast-container'
		document.body.appendChild(c)
		container = c
	}

	const toast = document.createElement('div')
	toast.className = `toast toast-${type}`

	// Icons
	const icons = {
		success:
			'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00a651" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
		error:
			'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#e22718" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
		info: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1c69d4" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
	}

	toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `

	container.appendChild(toast)

	// Animate in
	requestAnimationFrame(() => toast.classList.add('show'))

	// Auto dismiss
	setTimeout(() => {
		toast.classList.remove('show')
		setTimeout(() => toast.remove(), 300)
	}, 5000)
}

// Helpers
function createInput(name, label, value, type = 'text', placeholder = '') {
	return `
    <div class="form-group">
        <label class="form-label">${label}</label>
        <input type="${type}" name="${name}" class="form-control" value="${value || ''}" placeholder="${placeholder}">
    </div>`
}

function createSelect(name, label, value, options) {
	const opts = options
		.map(
			o =>
				`<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.text}</option>`,
		)
		.join('')
	return `
    <div class="form-group">
        <label class="form-label">${label}</label>
        <select name="${name}" class="form-control">
            ${opts}
        </select>
    </div>`
}

function formatDate(str) {
	return new Date(str).toLocaleDateString('ru-RU')
}

function formatPrice(p) {
	return new Intl.NumberFormat('ru-RU').format(p) + ' ₽'
}
