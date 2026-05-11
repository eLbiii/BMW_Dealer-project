/**
 * Каталог автомобилей BMW Dealer
 * Фильтрация, сортировка и пагинация
 */

// Глобальные переменные
let allCars = []
let filteredCars = []
let currentPage = 1
const carsPerPage = 10

// Текущие фильтры
let filters = {
	series: 'all',
	engine: 'all',
	condition: 'all',
	body: 'all',
	sort: 'default',
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function () {
	await loadCars()
	initFilters()
	initUrlFilters()
	renderCars()

	// Анимация появления фильтров при скролле
	gsap.from('.catalog-filters', {
		opacity: 0,
		y: 30,
		duration: 0.8,
		ease: 'power3.out',
		scrollTrigger: {
			trigger: '.catalog-filters',
			start: 'top 85%',
			toggleActions: 'play none none reverse',
		},
	})

	gsap.from('.filter-group', {
		opacity: 0,
		y: 20,
		duration: 0.6,
		stagger: 0.1,
		ease: 'power2.out',
		scrollTrigger: {
			trigger: '.catalog-filters',
			start: 'top 85%',
			toggleActions: 'play none none reverse',
		},
	})
})

/**
 * Загрузка данных автомобилей
 */
async function loadCars() {
	try {
		const response = await fetch('/api/cars')
		const result = await response.json()
		if (result.success) {
			allCars = result.data
			filteredCars = [...allCars]
		}
	} catch (error) {
		console.error('Ошибка загрузки каталога:', error)
		// Попробуем загрузить напрямую из JSON
		try {
			const response = await fetch('../src/assets/data/cars.json')
			allCars = await response.json()
			filteredCars = [...allCars]
		} catch (e) {
			console.error('Ошибка загрузки JSON:', e)
		}
	}
}

/**
 * Инициализация фильтров из URL
 */
function initUrlFilters() {
	const params = new URLSearchParams(window.location.search)

	if (params.get('condition')) {
		filters.condition = params.get('condition')
		setActiveChip('condition', filters.condition)
	}
	if (params.get('engine')) {
		filters.engine = params.get('engine')
		setActiveChip('engine', filters.engine)
	}
	if (params.get('body')) {
		filters.body = params.get('body')
		setActiveChip('body', filters.body)
	}

	applyFilters()
}

/**
 * Установка активного чипа
 */
function setActiveChip(filterType, value) {
	const chips = document.querySelectorAll(`[data-filter="${filterType}"]`)
	chips.forEach(chip => {
		chip.classList.remove('active')
		if (chip.dataset.value === value) {
			chip.classList.add('active')
		}
	})
}

/**
 * Инициализация обработчиков фильтров
 */
function initFilters() {
	// Чипы фильтров
	document.querySelectorAll('.filter-chip').forEach(chip => {
		chip.addEventListener('click', function () {
			const filterType = this.dataset.filter
			const value = this.dataset.value

			// Обновляем активный чип
			document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(c => {
				c.classList.remove('active')
			})
			this.classList.add('active')

			// Обновляем фильтр
			filters[filterType] = value
			currentPage = 1
			applyFilters()
			renderCars()
		})
	})

	// Сортировка
	const sortSelect = document.getElementById('sortPrice')
	if (sortSelect) {
		sortSelect.addEventListener('change', function () {
			filters.sort = this.value
			applyFilters()
			renderCars()
		})
	}
}

/**
 * Применение фильтров
 */
function applyFilters() {
	filteredCars = allCars.filter(car => {
		// Фильтр по серии
		if (filters.series !== 'all') {
			// Ищем точное совпадение или вхождение (для X5 M при выборе X5)
			if (
				car.series !== filters.series &&
				!car.series.includes(filters.series)
			) {
				return false
			}
		}

		// Фильтр по двигателю
		if (filters.engine !== 'all' && car.engine !== filters.engine) {
			return false
		}
		// Фильтр по состоянию
		if (filters.condition !== 'all' && car.condition !== filters.condition) {
			return false
		}
		// Фильтр по кузову
		if (filters.body !== 'all' && car.body !== filters.body) {
			return false
		}
		return true
	})

	// Сортировка
	if (filters.sort === 'asc') {
		filteredCars.sort((a, b) => a.price - b.price)
	} else if (filters.sort === 'desc') {
		filteredCars.sort((a, b) => b.price - a.price)
	} else {
		// По умолчанию сортируем по названию (модели)
		filteredCars.sort((a, b) => a.name.localeCompare(b.name))
	}
}

/**
 * Отрисовка карточек автомобилей с GSAP анимацией
 */
function renderCars() {
	const grid = document.getElementById('carsGrid')
	if (!grid) return

	const startIndex = (currentPage - 1) * carsPerPage
	const endIndex = startIndex + carsPerPage
	const carsToShow = filteredCars.slice(startIndex, endIndex)

	// Анимация исчезновения текущих карточек
	const currentCards = grid.querySelectorAll('.car-card')

	if (currentCards.length > 0) {
		gsap.to(currentCards, {
			opacity: 0,
			scale: 0.9,
			y: 20,
			duration: 0.3,
			stagger: 0.05,
			ease: 'power2.in',
			onComplete: () => updateGridContent(grid, carsToShow),
		})
	} else {
		updateGridContent(grid, carsToShow)
	}
}

/**
 * Обновление DOM и анимация появления новых карточек
 */
function updateGridContent(grid, carsToShow) {
	if (carsToShow.length === 0) {
		grid.innerHTML =
			'<div class="text-center p-8 w-full col-span-full"><h3>Автомобили не найдены</h3><p>Попробуйте изменить параметры фильтра</p></div>'
		renderPagination()
		return
	}

	grid.innerHTML = carsToShow.map(car => createCarCard(car)).join('')
	renderPagination()

	// Анимация появления новых карточек
	const newCards = grid.querySelectorAll('.car-card')
	gsap.fromTo(
		newCards,
		{ opacity: 0, scale: 0.9, y: 30 },
		{
			opacity: 1,
			scale: 1,
			y: 0,
			duration: 0.5,
			stagger: 0.1,
			ease: 'back.out(1.2)',
			clearProps: 'all', // Очищаем стили после анимации для корректной работы hover-эффектов
		},
	)

	// Инициализируем 3D Tilt эффект для только что добавленных карточек
	if (window.initTiltEffect) {
		window.initTiltEffect()
	}
}

/**
 * Создание карточки автомобиля
 */
function createCarCard(car) {
	// Бейджи
	const badges = []
	if (car.condition !== 'new') {
		badges.push('<span class="car-badge condition">С пробегом</span>')
	}

	// Характеристики
	let specs = []
	specs.push(
		`<span class="car-spec"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>${car.power}</span>`,
	)

	if (car.acceleration) {
		specs.push(
			`<span class="car-spec"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>${car.acceleration}</span>`,
		)
	}

	if (car.mileage) {
		specs.push(
			`<span class="car-spec"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 3v2"></path></svg>${car.mileage.toLocaleString()} км</span>`,
		)
	}

	// Форматирование цены
	const formattedPrice = new Intl.NumberFormat('ru-RU').format(car.price)

	// Dynamic image path
	const imageName = car.image ? car.image.trim() : ''
	const imageSrc = `/src/assets/images/cars/${imageName}`

	return `
        <div class="car-card">
            <div class="car-card-image">
                <img src="${imageSrc}" alt="${car.name}">
                <div class="car-card-badges">${badges.join('')}</div>
            </div>
            <div class="car-card-content">
                <h3 class="car-card-title">${car.name}</h3>
                <p class="car-card-subtitle">${car.year} • ${BMWDealer.t('body', car.body)} • ${BMWDealer.t('engine', car.engine)}</p>
                <div class="car-card-specs">${specs.join('')}</div>
                <div class="car-card-footer">
                    <div class="car-card-price">${formattedPrice} <span>₽</span></div>
                    <a href="car-detail.html?id=${car.id}" class="car-card-link">Подробнее</a>
                </div>
            </div>
        </div>
    `
}

/**
 * Отрисовка пагинации
 */
function renderPagination() {
	const pagination = document.getElementById('pagination')
	if (!pagination) return

	const totalPages = Math.ceil(filteredCars.length / carsPerPage)

	if (totalPages <= 1) {
		pagination.innerHTML = ''
		return
	}

	let html = ''

	// Кнопка "Назад"
	html += `<button class="pagination-item ${currentPage === 1 ? '' : ''}" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>`

	// Номера страниц
	for (let i = 1; i <= totalPages; i++) {
		if (
			i === 1 ||
			i === totalPages ||
			(i >= currentPage - 1 && i <= currentPage + 1)
		) {
			html += `<button class="pagination-item ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`
		} else if (i === currentPage - 2 || i === currentPage + 2) {
			html += '<span class="pagination-item">...</span>'
		}
	}

	// Кнопка "Вперёд"
	html += `<button class="pagination-item" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>`

	pagination.innerHTML = html
}

/**
 * Переход на страницу
 */
function goToPage(page) {
	const totalPages = Math.ceil(filteredCars.length / carsPerPage)
	if (page < 1 || page > totalPages) return

	currentPage = page
	renderCars()

	// Скролл к началу каталога
	document
		.getElementById('catalogFilters')
		?.scrollIntoView({ behavior: 'smooth' })
}

// Экспорт для использования в HTML
window.goToPage = goToPage
