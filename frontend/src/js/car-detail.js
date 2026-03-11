/**
 * Скрипт для страницы деталей автомобиля
 */
document.addEventListener('DOMContentLoaded', async function () {
	const params = new URLSearchParams(window.location.search)
	const carId = params.get('id')

	if (!carId) {
		window.location.href = 'catalog.html'
		return
	}

	const container = document.getElementById('carDetailContainer')

	try {
		// Fetch ALL cars since we don't have a reliable single-car endpoint yet or it redirects
		const response = await fetch('/api/cars')
		const result = await response.json()

		if (result.success) {
			const car = result.data.find(c => c.id == carId) // flexible equality check

			if (car) {
				renderCarDetail(car)
			} else {
				container.innerHTML =
					'<h3>Автомобиль не найден</h3><a href="catalog.html" class="btn btn-primary">Вернуться в каталог</a>'
			}
		} else {
			throw new Error('Failed to load cars')
		}
	} catch (error) {
		console.error('Error:', error)
		container.innerHTML =
			'<h3>Ошибка загрузки данных</h3><p>Попробуйте позже</p>'
	}
})

function renderCarDetail(car) {
	// Parse JSON fields if they are strings (coming from SQLite)
	try {
		if (typeof car.facts === 'string') car.facts = JSON.parse(car.facts)
		if (typeof car.tech_specs === 'string')
			car.tech_specs = JSON.parse(car.tech_specs)
	} catch (e) {
		console.error('Error parsing JSON fields', e)
	}

	const container = document.getElementById('carDetailContainer')
	const template = document.getElementById('carDetailTemplate')
	const content = template.content.cloneNode(true)

	// Image
	const imgPath = `/src/assets/images/cars/${car.detail_image || car.image}`
	const img = content.getElementById('detailImage')
	img.src = imgPath

	// Text info
	content.getElementById('detailName').textContent = car.name
	content.getElementById('detailSubtitle').textContent =
		`${car.year} • ${car.transmission} • ${BMWDealer.t('body', car.body)}`
	content.getElementById('detailPrice').textContent = BMWDealer.formatPrice(
		car.price,
	)
	content.getElementById('detailDescription').textContent =
		car.description || 'Описание отсутствует.'

	// Specs
	content.getElementById('specAcceleration').textContent =
		car.acceleration || '-'
	content.getElementById('specPower').textContent = car.power || '-'
	content.getElementById('specEngine').textContent =
		`${BMWDealer.t('engine', car.engine)} ${car.consumption ? ' • ' + car.consumption : ''}`
	content.getElementById('specDrive').textContent = BMWDealer.t(
		'drive',
		car.drive,
	)

	// --- Rich Content ---

	// Model Info
	if (car.model_info) {
		content.getElementById('detailModelInfo').textContent = car.model_info
	}

	// Facts
	if (car.facts && Array.isArray(car.facts)) {
		const factsList = content.getElementById('detailFacts')
		car.facts.forEach(fact => {
			const li = document.createElement('li')
			li.textContent = `✦ ${fact}`
			li.style.marginBottom = '0.5rem'
			factsList.appendChild(li)
		})
	}

	// Engine Info
	if (car.engine_info) {
		content.getElementById('detailEngineInfo').textContent = car.engine_info
	}

	// Tech Specs Table
	if (car.tech_specs) {
		const tableBody = content.getElementById('detailTechSpecs')
		const labels = {
			engine_code: 'Код двигателя',
			torque: 'Крутящий момент',
			weight: 'Масса',
			'0-100': 'Разгон 0-100',
			max_speed: 'Макс. скорость',
			trunk: 'Объем багажника',
			battery: 'Емкость батареи',
			length: 'Длина',
			width: 'Ширина',
			height: 'Высота',
		}

		for (const [key, value] of Object.entries(car.tech_specs)) {
			const tr = document.createElement('tr')
			tr.innerHTML = `
                <td style="padding: 0.75rem 0; border-bottom: 1px solid #eee; color: #666;">${labels[key] || key}</td>
                <td style="padding: 0.75rem 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${value}</td>
            `
			tableBody.appendChild(tr)
		}
	}

	// Update Credit Link params
	const creditBtn = content.querySelector('a[href="credit.html"]')
	if (creditBtn) {
		creditBtn.href = `credit.html?price=${car.price}&model=${encodeURIComponent(car.name)}`
	}

	container.innerHTML = ''
	container.appendChild(content)
}
