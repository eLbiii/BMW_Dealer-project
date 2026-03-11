document.addEventListener('DOMContentLoaded', () => {
	loadReviews()
	initFilters()
})

const ITEMS_PER_PAGE = 10
let currentPage = 1
let allReviews = []

async function loadReviews() {
	const grid = document.getElementById('reviewsGrid')
	// const pagination is rendered dynamically

	try {
		// If we already have data (from previous load), we can just re-render
		// But for completeness let's fetch if empty
		if (allReviews.length === 0) {
			const res = await fetch('/api/feedback/public')
			const json = await res.json()

			if (json.success) {
				allReviews = json.data
				// Sort defaults to new? initFilters will sort.
				// Let's default sort:
				allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			} else {
				grid.innerHTML =
					'<div style="grid-column: 1/-1; text-align: center;">Не удалось загрузить отзывы</div>'
				return
			}
		}

		renderReviews()
	} catch (error) {
		console.error(error)
		grid.innerHTML =
			'<div style="grid-column: 1/-1; text-align: center;">Ошибка соединения</div>'
	}
}

function renderReviews(sourceArray = allReviews) {
	const grid = document.getElementById('reviewsGrid')
	const pagination = document.getElementById('pagination')

	if (sourceArray.length === 0) {
		grid.innerHTML =
			'<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Пока нет отзывов. Станьте первым!</div>'
		if (pagination) pagination.innerHTML = ''
		return
	}

	// Paging logic
	const totalPages = Math.ceil(sourceArray.length / ITEMS_PER_PAGE)
	if (currentPage > totalPages) currentPage = totalPages
	if (currentPage < 1) currentPage = 1

	const start = (currentPage - 1) * ITEMS_PER_PAGE
	const end = start + ITEMS_PER_PAGE
	const itemsToShow = sourceArray.slice(start, end)

	grid.innerHTML = itemsToShow
		.map(
			review => `
        <div class="review-card" style="background: var(--bmw-gray-dark); padding: 1.5rem; border-radius: 8px;">
            <div class="review-header" style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div class="review-author" style="font-weight: bold; color: #fff;">${review.name}</div>
                <div class="review-date" style="color: #888; font-size: 0.9rem;">${formatDate(review.createdAt)}</div>
            </div>
            <div class="review-rating" style="margin-bottom: 0.5rem;">
                ${generateStars(5)} 
            </div>
            <div class="review-text" style="color: #ccc; line-height: 1.5;">
                "${review.message}"
            </div>
            ${review.theme ? `<div class="review-car" style="margin-top: 1rem; color: var(--bmw-blue); font-size: 0.9rem;">${review.theme}</div>` : ''}
        </div>
    `,
		)
		.join('')

	// Render Pagination Controls
	if (pagination) {
		if (totalPages <= 1) {
			pagination.innerHTML = ''
		} else {
			let btns = ''
			for (let i = 1; i <= totalPages; i++) {
				btns += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" 
                        onclick="changePage(${i})" style="margin: 0 5px;">${i}</button>`
			}
			pagination.innerHTML = `
                <div style="display:flex; justify-content:center; margin-top: 2rem;">
                    ${btns}
                </div>
            `
		}
	}
}

window.changePage = function (p) {
	currentPage = p
	// We need to know which array to render if we are filtered.
	// Ideally we store 'currentFiltered' global.
	// For now, let's assume allReviews is what we render if sort didn't change array reference.
	// However, initFilters sorts a COPY.
	// Let's make sort update the GLOBAL allReviews or a 'filteredReviews' global.
	// Update: user requested sort.
	// Let's modify initFilters to update global variable or call render with correct page.
	// Simple fix: if filtered, we need to persist state.
	// Let's stick to allReviews being the single source of truth but sorted in place.
	renderReviews()
	document
		.getElementById('reviewsFilters')
		.scrollIntoView({ behavior: 'smooth' })
}

function initFilters() {
	const sortSelect = document.getElementById('sortDate')
	if (sortSelect) {
		sortSelect.addEventListener('change', e => {
			const val = e.target.value
			if (val === 'newest')
				allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			if (val === 'oldest')
				allReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

			currentPage = 1
			renderReviews()
		})
	}

	// Handle Review Form Submit (Public)
	const form = document.getElementById('reviewForm')
	if (form) {
		form.addEventListener('submit', async e => {
			e.preventDefault()
			const inputs = form.querySelectorAll('input, textarea, select')
			let data = {}
			inputs.forEach(i => {
				if (i.type !== 'submit')
					data[
						i.className.includes('form-control')
							? i.tagName === 'TEXTAREA'
								? 'message'
								: 'temp'
							: 'temp'
					] = i.value
			})

			const name = form.querySelector('input[placeholder="Имя"]').value
			const car = form.querySelector(
				'input[placeholder="Например, BMW X5"]',
			).value
			const text = form.querySelector('textarea').value

			const payload = {
				name: name,
				email: 'anonymous@review.com',
				theme: car,
				message: text,
			}

			try {
				const res = await fetch('/api/feedback', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				})
				const result = await res.json()
				if (result.success) {
					BMWDealer.showToast(
						'success',
						'Отзыв отправлен',
						'Спасибо! Ваш отзыв отправлен на модерацию.',
					)
					document.querySelector('.modal-overlay').classList.remove('active')
					form.reset()
				} else {
					BMWDealer.showToast('error', 'Ошибка', result.message)
				}
			} catch (err) {
				BMWDealer.showToast(
					'error',
					'Ошибка сети',
					'Не удалось отправить отзыв.',
				)
			}
		})
	}
}

function formatDate(str) {
	return new Date(str).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

function generateStars(n) {
	let stars = ''
	// Always show 5 stars for now as we don't have rating in DB yet,
	// or we could randomize it for visual variety if needed, but 5 is better for "marketing".
	// User asked for "stars placed yellow".
	for (let i = 0; i < 5; i++) {
		stars += `<svg viewBox="0 0 24 24" width="18" height="18" fill="#ffc107" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`
	}
	return `<div style="display:flex; gap: 2px;">${stars}</div>`
}
