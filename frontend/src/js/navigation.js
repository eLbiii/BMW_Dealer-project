/**
 * Навигация и бургер-меню BMW Dealer
 */

document.addEventListener('DOMContentLoaded', function () {
	initBurgerMenu()
	initMobileSubmenu()
	initDropdownMenu()
})

/**
 * Инициализация бургер-меню
 */
function initBurgerMenu() {
	const burgerBtn = document.getElementById('burgerBtn')
	const mobileMenu = document.getElementById('mobileMenu')
	const mobileMenuOverlay = document.getElementById('mobileMenuOverlay')
	const mobileMenuClose = document.getElementById('mobileMenuClose')

	if (!burgerBtn || !mobileMenu) return

	// Создаем таймлайн один раз при загрузке
	const mobileMenuTl = gsap.timeline({ paused: true, reversed: true })

	// 1. Анимация оверлея
	mobileMenuTl.to(
		mobileMenuOverlay,
		{
			opacity: 1,
			visibility: 'visible',
			duration: 0.3,
			ease: 'power2.inOut',
		},
		0,
	)

	// 2. Выезд панели
	mobileMenuTl.to(
		mobileMenu,
		{
			x: '0%',
			duration: 0.5,
			ease: 'power3.inOut',
		},
		0,
	)

	// 3. Появление пунктов меню (Stagger effect) каскадом
	const navItems = gsap.utils.toArray(
		mobileMenu.querySelectorAll('.mobile-nav-item'),
	)
	mobileMenuTl.fromTo(
		navItems,
		{
			y: 20,
			opacity: 0,
		},
		{
			y: 0,
			opacity: 1,
			duration: 0.4,
			stagger: 0.05,
			ease: 'power2.out',
		},
		'-=0.2',
	)

	// 4. Появление элементов футера
	const footerActions = gsap.utils.toArray(
		mobileMenu.querySelectorAll('.mobile-menu-actions .mobile-menu-action'),
	)
	if (footerActions.length) {
		mobileMenuTl.fromTo(
			footerActions,
			{
				x: 20,
				opacity: 0,
			},
			{
				x: 0,
				opacity: 1,
				duration: 0.4,
				stagger: 0.1,
				ease: 'power2.out',
			},
			'-=0.2',
		)
	}

	// Сохраняем таймлайн в глобальную переменную для доступа
	window.mobileMenuTl = mobileMenuTl

	if (!burgerBtn || !mobileMenu) return

	// Открытие меню
	burgerBtn.addEventListener('click', function () {
		toggleMobileMenu(true)
	})

	// Закрытие по кнопке
	if (mobileMenuClose) {
		mobileMenuClose.addEventListener('click', function () {
			toggleMobileMenu(false)
		})
	}

	// Закрытие по overlay
	if (mobileMenuOverlay) {
		mobileMenuOverlay.addEventListener('click', function () {
			toggleMobileMenu(false)
		})
	}

	// Закрытие по Escape
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
			toggleMobileMenu(false)
		}
	})
}

/**
 * Переключение мобильного меню
 */
function toggleMobileMenu(open) {
	const burgerBtn = document.getElementById('burgerBtn')
	const mobileMenu = document.getElementById('mobileMenu')
	const mobileMenuOverlay = document.getElementById('mobileMenuOverlay')

	if (!mobileMenu) return

	if (open) {
		document.body.classList.add('menu-open')
		burgerBtn?.classList.add('active')
		mobileMenu.classList.add('active') // Оставляем для блочной модели CSS
		window.mobileMenuTl.play()
	} else {
		window.mobileMenuTl.reverse().then(() => {
			document.body.classList.remove('menu-open')
			burgerBtn?.classList.remove('active')
			mobileMenu.classList.remove('active')
		})
	}
}

/**
 * Инициализация подменю в мобильном меню
 */
function initMobileSubmenu() {
	const mobileNavItems = document.querySelectorAll('.mobile-nav-item')

	mobileNavItems.forEach(item => {
		const link = item.querySelector('.mobile-nav-link')
		const submenu = item.querySelector('.mobile-nav-submenu')

		if (link && submenu) {
			link.addEventListener('click', function (e) {
				e.preventDefault()

				// Закрываем все остальные подменю
				mobileNavItems.forEach(otherItem => {
					if (otherItem !== item) {
						otherItem.classList.remove('open')
					}
				})

				// Переключаем текущее
				item.classList.toggle('open')
			})
		}
	})
}

/**
 * Инициализация выпадающих меню на десктопе
 */
function initDropdownMenu() {
	const navItems = document.querySelectorAll('.nav-item')

	navItems.forEach(item => {
		const dropdown = item.querySelector('.nav-dropdown')

		if (dropdown) {
			// Для сенсорных устройств
			const link = item.querySelector('.nav-link')

			if (link) {
				link.addEventListener('click', function (e) {
					// Проверяем, является ли устройство сенсорным
					if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
						e.preventDefault()

						// Закрываем все остальные
						navItems.forEach(otherItem => {
							if (otherItem !== item) {
								otherItem.classList.remove('dropdown-open')
							}
						})

						item.classList.toggle('dropdown-open')
					}
				})
			}

			// Закрытие при клике вне меню
			document.addEventListener('click', function (e) {
				if (!item.contains(e.target)) {
					item.classList.remove('dropdown-open')
				}
			})
		}
	})
}

// Закрытие меню при изменении размера экрана выше 1600px
window.addEventListener('resize', function () {
	if (window.innerWidth > 1600) {
		toggleMobileMenu(false)
	}
})
