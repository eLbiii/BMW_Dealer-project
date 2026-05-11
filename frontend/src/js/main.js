/**
 * Главный JavaScript файл BMW Dealer
 * Общие функции для всех страниц
 */

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
	// Инициализация header при скролле
	initHeaderScroll()

	// Инициализация FAQ аккордеона
	initFaqAccordion()

	// Инициализация модальных окон
	initModals()

	// Инициализация форм
	initForms()

	// Заполнение списков автомобилей
	initCarSelects()

	// Маска телефона
	initPhoneMasks()

	// Автозаполнение форм (из профиля или URL)
	checkAuthAndAutoFill()
})

/**
 * Автоматическое заполнение форм для авторизованных пользователей
 */
function checkAuthAndAutoFill() {
	// 1. Check LocalStorage
	const userStr = localStorage.getItem('bmw_user')
	let user = null
	if (userStr) {
		try {
			user = JSON.parse(userStr)
		} catch (e) {}
	}

	if (user) {
		// Auto-fill standard fields
		fillField('name', user.name)
		fillField('firstName', user.name.split(' ')[0]) // heuristic
		fillField('lastName', user.name.split(' ')[1] || '') // heuristic
		fillField('email', user.email)
		fillField('phone', user.phone || '') // if backend returned phone (it doesn't currently store it for individual explicitly in all cases, but let's assume)

		// Update header user icon link
		const loginBtn =
			document.querySelector('a[href="pages/login.html"]') ||
			document.querySelector('a[href="login.html"]')
		if (loginBtn) {
			loginBtn.href = window.location.pathname.includes('pages')
				? 'profile.html'
				: 'pages/profile.html'
			loginBtn.title = user.name
		}
	}

	// 2. Check URL Params (for "Book Service" from Profile)
	const params = new URLSearchParams(window.location.search)
	const vin = params.get('vin')
	const model = params.get('model')

	if (vin) fillField('vin', vin)
	if (model) {
		fillField('model', model)
		fillField('carModel', model) // some forms use carModel

		// Try to select in dropdown if exists
		const select = document.querySelector('select.car-select')
		if (select) {
			select.value = model
			// trigger rich selection update if possible, or just native set
		}
	}
}

function fillField(name, value) {
	if (!value) return
	const inputs = document.querySelectorAll(
		`input[name="${name}"], textarea[name="${name}"]`,
	)
	inputs.forEach(input => {
		if (!input.value) input.value = value
	})
}

/**
 * Строгая маска и валидация для телефонов (+7 (XXX) XXX-XX-XX)
 */
function initPhoneMasks() {
	const phoneInputs = document.querySelectorAll(
		'input[type="tel"], input[name="phone"]',
	)

	phoneInputs.forEach(input => {
		// Устанавливаем минимальную длину для нативной валидации браузером
		input.setAttribute('minlength', '18') // длина строки "+7 (999) 000-00-00"
		input.setAttribute('maxlength', '18')

		input.addEventListener('input', function (e) {
			// Очищаем ввод от всего кроме цифр
			let x = e.target.value.replace(/\D/g, '')

			// Если строка пустая, обнуляем
			if (!x) {
				e.target.value = ''
				return
			}

			// Если номер начинается не с 7 или 8, добавляем 7
			// (если пользователь вводит сразу '9', получится '79')
			if (x[0] !== '7' && x[0] !== '8') {
				x = '7' + x
			}

			// Всегда заменяем первую цифру на 7 для единообразия в UI
			// (на бэкенд уйдет +7)
			if (x.length > 0) {
				x = '7' + x.substring(1)
			}

			// Формируем маску
			let formattedValue = '+7'
			if (x.length > 1) {
				formattedValue += ' (' + x.substring(1, 4)
			}
			if (x.length >= 5) {
				formattedValue += ') ' + x.substring(4, 7)
			}
			if (x.length >= 8) {
				formattedValue += '-' + x.substring(7, 9)
			}
			if (x.length >= 10) {
				formattedValue += '-' + x.substring(9, 11)
			}

			e.target.value = formattedValue
		})

		// При фокусе, если пусто, ставим +7
		input.addEventListener('focus', () => {
			if (!input.value) {
				input.value = '+7 ('
			}
		})

		// Очистка при потере фокуса, если ввели только "+7 ("
		input.addEventListener('blur', () => {
			if (
				input.value === '+7' ||
				input.value === '+7 (' ||
				input.value === ''
			) {
				input.value = ''
			}
		})
	})
}

/**
 * Заполнение списков автомобилей
 */
/**
 * Заполнение списков автомобилей
 */
async function initCarSelects() {
	const selects = document.querySelectorAll('.car-select')
	if (selects.length === 0) return

	try {
		const response = await fetch('/api/cars')
		const result = await response.json()

		if (result.success) {
			const cars = result.data.sort((a, b) => a.name.localeCompare(b.name))

			selects.forEach(select => {
				// Skip if already initialized (check child count > 1)
				// But we want to re-init if needed. Ideally clear first.
				// Keep the first option (placeholder)
				const placeholder = select.options[0]
				select.innerHTML = ''
				select.appendChild(placeholder)

				cars.forEach(car => {
					const option = document.createElement('option')
					option.value = car.name
					option.textContent = `${car.name}` // Removed price from text to keep it clean in rich select trigger
					option.dataset.price = car.price
					option.dataset.image = car.image // Store image for rich select
					option.dataset.series = car.series
					select.appendChild(option)
				})

				// Listen for change to update price in Calculator
				select.addEventListener('change', function () {
					const selectedOption = this.options[this.selectedIndex]
					const price = selectedOption.dataset.price
					if (price) {
						const priceInput = document.getElementById('priceRange')
						const priceDisplay = document.getElementById('priceValue')
						if (priceInput && priceDisplay) {
							priceInput.value = price
							priceDisplay.textContent = formatPrice(price)
							priceInput.dispatchEvent(new Event('input'))
						}
					}
				})

				// Initialize Rich UI
				initRichSelect(select, cars)
			})
		}
	} catch (error) {
		console.error('Error loading cars:', error)
	}
}

/**
 * Инициализация кастомного селекта с картинками
 */
function initRichSelect(originalSelect, cars) {
	// Hide original
	originalSelect.style.display = 'none'

	// Create Wrapper
	const wrapper = document.createElement('div')
	wrapper.className = 'rich-select'

	// Trigger
	const trigger = document.createElement('div')
	trigger.className = 'rich-select-trigger'
	trigger.innerHTML = `<span>${originalSelect.options[0].textContent}</span>`

	// Dropdown
	const dropdown = document.createElement('div')
	dropdown.className = 'rich-select-dropdown'

	// Populate Dropdown Items
	cars.forEach(car => {
		const item = document.createElement('div')
		item.className = 'rich-select-item'
		// Image path
		const imgPath = `/src/assets/images/cars/${car.image}`

		item.innerHTML = `
            <img src="${imgPath}" alt="${car.name}" loading="lazy">
            <div>
                <span class="series-badge">${car.series}</span>
                <span>${car.name}</span>
            </div>
        `

		item.addEventListener('click', () => {
			// Update Original Select
			originalSelect.value = car.name
			originalSelect.dispatchEvent(new Event('change')) // Trigger changes

			// Update Trigger UI
			trigger.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <img src="${imgPath}" alt="${car.name}" style="width: 40px; margin-right: 10px;">
                    <span>${car.name}</span>
                </div>
            `

			// Close dropdown
			wrapper.classList.remove('open')
		})

		dropdown.appendChild(item)
	})

	wrapper.appendChild(trigger)
	wrapper.appendChild(dropdown)

	// Insert after original select
	originalSelect.parentNode.insertBefore(wrapper, originalSelect.nextSibling)

	// Toggle dropdown
	trigger.addEventListener('click', e => {
		e.stopPropagation()
		// Close other rich selects?
		document.querySelectorAll('.rich-select').forEach(el => {
			if (el !== wrapper) el.classList.remove('open')
		})
		wrapper.classList.toggle('open')
	})

	// Close on click outside
	document.addEventListener('click', e => {
		if (!wrapper.contains(e.target)) {
			wrapper.classList.remove('open')
		}
	})

	// Sync if original select changes programmatically (e.g. from URL params)
	// We can observe mutations or just handle it if we know when it happens.
	// For now, let's check initial value.
	if (originalSelect.value) {
		const selectedCar = cars.find(c => c.name === originalSelect.value)
		if (selectedCar) {
			trigger.innerHTML = `
                <div style="display:flex; align-items:center;">
                     <img src="/src/assets/images/cars/${selectedCar.image}" alt="${selectedCar.name}" style="width: 40px; margin-right: 10px;">
                    <span>${selectedCar.name}</span>
                </div>
            `
		}
	}
}

/**
 * Изменение header при скролле
 */
function initHeaderScroll() {
	const header = document.getElementById('header')
	if (!header) return

	window.addEventListener('scroll', function () {
		if (window.scrollY > 50) {
			header.classList.add('scrolled')
		} else {
			header.classList.remove('scrolled')
		}
	})
}

/**
 * FAQ Аккордеон
 */
function initFaqAccordion() {
	const faqItems = document.querySelectorAll('.faq-item')

	faqItems.forEach(item => {
		const question = item.querySelector('.faq-question')
		if (question) {
			question.addEventListener('click', function () {
				// Закрываем все остальные
				faqItems.forEach(otherItem => {
					if (otherItem !== item) {
						otherItem.classList.remove('active')
					}
				})
				// Переключаем текущий
				item.classList.toggle('active')
			})
		}
	})
}

/**
 * Модальные окна
 */
function initModals() {
	// Закрытие модального окна при клике на overlay
	document.querySelectorAll('.modal-overlay').forEach(overlay => {
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) {
				closeModal(overlay)
			}
		})
	})

	// Закрытие по кнопке
	document.querySelectorAll('.modal-close').forEach(btn => {
		btn.addEventListener('click', function () {
			const modal = btn.closest('.modal-overlay')
			closeModal(modal)
		})
	})

	// Закрытие по Escape
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			const activeModal = document.querySelector('.modal-overlay.active')
			if (activeModal) {
				closeModal(activeModal)
			}
		}
	})
}

/**
 * Открыть модальное окно
 */
function openModal(modalId) {
	const modal = document.getElementById(modalId)
	if (modal) {
		modal.classList.add('active')
		document.body.style.overflow = 'hidden'
	}
}

/**
 * Закрыть модальное окно
 */
function closeModal(modal) {
	if (typeof modal === 'string') {
		modal = document.getElementById(modal)
	}
	if (modal) {
		modal.classList.remove('active')
		document.body.style.overflow = ''
	}
}

/**
 * Инициализация форм
 */
function initForms() {
	const forms = document.querySelectorAll('form[data-ajax]')

	forms.forEach(form => {
		form.addEventListener('submit', async function (e) {
			e.preventDefault()

			const submitBtn = form.querySelector('button[type="submit"]')
			const originalText = submitBtn ? submitBtn.textContent : ''

			// Показываем загрузку
			if (submitBtn) {
				submitBtn.disabled = true
				submitBtn.innerHTML =
					'<span class="loader loader-sm"></span> Отправка...'
			}

			try {
				const formData = new FormData(form)
				const data = Object.fromEntries(formData.entries())

				const response = await fetch(form.action, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				})

				const result = await response.json()

				if (result.success) {
					showToast(
						'success',
						'Успешно!',
						result.message || 'Форма успешно отправлена',
					)
					form.reset()
				} else {
					showToast(
						'error',
						'Ошибка',
						result.message || 'Произошла ошибка при отправке',
					)
				}
			} catch (error) {
				showToast(
					'error',
					'Ошибка',
					'Не удалось отправить форму. Попробуйте позже.',
				)
				console.error('Form submit error:', error)
			} finally {
				if (submitBtn) {
					submitBtn.disabled = false
					submitBtn.textContent = originalText
				}
			}
		})
	})
}

/**
 * Показать toast уведомление
 */
function showToast(type, title, message, duration = 5000) {
	const container = document.getElementById('toastContainer')
	if (!container) return

	const toast = document.createElement('div')
	toast.className = `toast toast-${type}`

	// Иконки для разных типов
	const icons = {
		success:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
		error:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
		warning:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
		info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
	}

	toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `

	container.appendChild(toast)

	// Анимация появления
	setTimeout(() => toast.classList.add('show'), 10)

	// Автоудаление
	setTimeout(() => {
		toast.classList.remove('show')
		setTimeout(() => toast.remove(), 300)
	}, duration)
}

/**
 * Форматирование цены
 */
function formatPrice(price) {
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'RUB',
		maximumFractionDigits: 0,
	}).format(price)
}

/**
 * Форматирование даты
 */
function formatDate(dateString) {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('ru-RU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date)
}

/**
 * Генерация звезд рейтинга
 */
function generateRatingStars(rating) {
	let stars = ''
	for (let i = 1; i <= 5; i++) {
		if (i <= rating) {
			stars +=
				'<svg viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
		} else {
			stars +=
				'<svg viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" stroke-width="1" class="empty"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
		}
	}
	return stars
}

// Экспортируем функции для использования в других скриптах
window.BMWDealer = {
	showToast,
	openModal,
	closeModal,
	formatPrice,
	formatDate,
	generateRatingStars,
	// Словари для перевода
	translations: {
		engine: {
			petrol: 'Бензин',
			diesel: 'Дизель',
			electric: 'Электро',
			hybrid: 'Гибрид',
		},
		body: {
			sedan: 'Седан',
			coupe: 'Купе',
			wagon: 'Универсал',
			crossover: 'Кроссовер',
			convertible: 'Кабриолет',
			hatchback: 'Хэтчбек',
		},
		transmission: {
			Automatic: 'Автомат',
			Manual: 'Механика',
			Robot: 'Робот',
			Автомат: 'Автомат', // Fallback
			Механика: 'Механика',
		},
		drive: {
			Full: 'Полный',
			Rear: 'Задний',
			Front: 'Передний',
			Полный: 'Полный', // Fallback
			Задний: 'Задний',
			Передний: 'Передний',
		},
	},
	// Функция для перевода
	t(category, key) {
		if (!key) return ''
		// Если ключ уже на русском (или не найден), возвращаем как есть, но пробуем найти в словаре
		const dict = this.translations[category]
		if (dict && dict[key.toLowerCase()]) {
			return dict[key.toLowerCase()]
		}
		if (dict && dict[key]) {
			return dict[key]
		}
		return key
	},
}
