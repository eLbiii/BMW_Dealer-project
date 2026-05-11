/**
 * Кредитный калькулятор
 */

document.addEventListener('DOMContentLoaded', function () {
	initCreditCalculator()
})

function initCreditCalculator() {
	const priceInput = document.getElementById('priceRange')
	const initialInput = document.getElementById('initialRange')
	const termInput = document.getElementById('termRange')

	// Элементы для отображения значений
	const priceValue = document.getElementById('priceValue')
	const initialValue = document.getElementById('initialValue')
	const initialPercent = document.getElementById('initialPercent')
	const termValue = document.getElementById('termValue')
	const monthlyPayment = document.getElementById('monthlyPayment')
	const modelSelect = document.querySelector('select[name="model"]')

	if (!priceInput || !initialInput || !termInput) return

	// --- URL Params Handling ---
	const params = new URLSearchParams(window.location.search)
	const urlPrice = params.get('price')
	const urlModel = params.get('model')
	// const urlId = params.get('id'); // ID unused for calculation directly but good for context

	if (urlPrice) {
		priceInput.value = urlPrice
		priceInput.disabled = true // Lock price
		// Update label to indicate locked state
		priceInput.parentElement.querySelector(
			'label span:first-child',
		).textContent += ' (Фиксировано)'
		priceInput.style.opacity = '0.7'
	}

	const calculate = () => {
		const price = parseInt(priceInput.value)
		const initialPct = parseInt(initialInput.value)
		const term = parseInt(termInput.value)

		// Расчет первоначального взноса в рублях
		const initialPayment = Math.round(price * (initialPct / 100))

		// Тело кредита
		const loanAmount = price - initialPayment

		// Ставка (упрощенно 12% годовых)
		const rate = 12
		const monthlyRate = rate / 12 / 100

		// Ежемесячный платеж (аннуитетный)
		// PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
		const payment = Math.round(
			(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
				(Math.pow(1 + monthlyRate, term) - 1),
		)

		// Обновление UI
		priceValue.textContent = new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
		initialValue.textContent =
			new Intl.NumberFormat('ru-RU').format(initialPayment) + ' ₽'
		initialPercent.textContent = initialPct + '%'
		termValue.textContent = term + ' мес.'
		monthlyPayment.textContent =
			new Intl.NumberFormat('ru-RU').format(payment) + ' ₽'
	}

	// Слушатели событий
	priceInput.addEventListener('input', calculate)
	initialInput.addEventListener('input', calculate)
	termInput.addEventListener('input', calculate)

	// Populate Car Select
	async function populateCars() {
		try {
			const response = await fetch('/api/cars')
			const data = await response.json()
			if (data.success) {
				data.data.forEach(car => {
					const option = document.createElement('option')
					option.value = car.name // Using name as value per requirements usually, or ID
					option.textContent = car.name
					if (
						urlModel &&
						(car.name === urlModel || car.series + ' ' + car.name === urlModel)
					) {
						// Loose match
						option.selected = true
					}
					modelSelect.appendChild(option)
				})

				if (urlModel) {
					// Try to toggle URL model if fetch is slow?
					// Set value explicitly just in case name matches
					modelSelect.value = urlModel
					modelSelect.disabled = true // Lock model
					// Add hidden input so it submits
					const hiddenModel = document.createElement('input')
					hiddenModel.type = 'hidden'
					hiddenModel.name = 'model'
					hiddenModel.value = urlModel
					modelSelect.form.appendChild(hiddenModel)
				}
			}
		} catch (e) {
			console.error('Failed to load cars for credit form', e)
		}
	}
	populateCars()

	// Первичный расчет
	calculate()
}
