/**
 * GSAP & Lenis Animations
 * BMW Premium Redesign
 */

// Ожидаем полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
	// 1. Инициализация Lenis (Smooth Scroll)
	const lenis = new Lenis({
		duration: 1.2,
		easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Плавное замедление
		direction: 'vertical',
		gestureDirection: 'vertical',
		smooth: true,
		mouseMultiplier: 1,
		smoothTouch: false,
		touchMultiplier: 2,
		infinite: false,
	})

	// Интеграция Lenis с ScrollTrigger GSAP
	lenis.on('scroll', ScrollTrigger.update)

	gsap.ticker.add(time => {
		lenis.raf(time * 1000)
	})

	gsap.ticker.lagSmoothing(0)

	// 2. Анимация появления Hero-секции
	const heroTl = gsap.timeline()

	// Apple-style Text Reveal (С эффектом Blur)
	const heroTitle = document.querySelector('.hero-title')
	if (heroTitle) {
		// Оборачиваем слова в span для красивой анимации (очень простая реализация Split-эффекта)
		const text = heroTitle.innerHTML
		const splitText = text
			.split('<br>')
			.map(line => {
				return line
					.split(' ')
					.map(
						word =>
							`<span class="word-wrap" style="display:inline-block; overflow:hidden; vertical-align:top; "><span class="word" style="display:inline-block; transform-origin: left bottom; filter: blur(5px); opacity: 0; transform: translateY(100%) rotate(3deg);">${word}</span></span>`,
					)
					.join('&nbsp;')
			})
			.join('<br>')
		heroTitle.innerHTML = splitText

		heroTl.to('.hero-title .word', {
			y: '0%',
			rotation: 0,
			filter: 'blur(0px)',
			opacity: 1,
			duration: 0.6 /* ускорено с 1.2 */,
			stagger: 0.05 /* ускорено с 0.1 */,
			ease: 'power4.out',
			delay: 0 /* убран стартовый delay */,
		})
	}

	const fadeUpElements = gsap.utils.toArray('.gsap-fade-up')
	if (fadeUpElements.length > 0) {
		heroTl.fromTo(
			fadeUpElements,
			{ y: 20, opacity: 0, filter: 'blur(5px)' } /* уменьшен сдвиг */,
			{
				y: 0,
				opacity: 1,
				filter: 'blur(0px)',
				duration: 0.6 /* ускорено */,
				stagger: 0.1,
				ease: 'power3.out',
			},
			'-=0.4' /* вызов быстрее */,
		)
	}

	// Анимация параллакса для фона Hero-секции
	const heroBg = document.querySelector('.hero-bg.gsap-parallax')
	if (heroBg) {
		gsap.to(heroBg, {
			yPercent: 30,
			ease: 'none',
			scrollTrigger: {
				trigger: '.hero',
				start: 'top top',
				end: 'bottom top',
				scrub: 1,
			},
		})
	}

	const heroOverlay = document.querySelector('.hero-overlay')
	if (heroOverlay) {
		gsap.to(heroOverlay, {
			opacity: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.8)',
			ease: 'none',
			scrollTrigger: {
				trigger: '.hero',
				start: 'top top',
				end: 'bottom top',
				scrub: 1,
			},
		})
	}

	// 3. Анимация появления карточек преимуществ при скролле
	const cards = gsap.utils.toArray('.info-card')
	if (cards.length > 0) {
		gsap.fromTo(
			cards,
			{ y: 50, opacity: 0, scale: 0.95 },
			{
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 0.8,
				stagger: 0.15,
				ease: 'back.out(1.2)',
				scrollTrigger: {
					trigger: '.cards-grid',
					start: 'top 85%',
					toggleActions: 'play none none reverse',
				},
			},
		)
	}

	// 4. Анимация секции баннера "С пробегом"
	const banner = document.querySelector('.banner-section')
	if (banner) {
		gsap.fromTo(
			banner,
			{ scale: 0.95, opacity: 0, borderRadius: '40px' },
			{
				scale: 1,
				opacity: 1,
				borderRadius: '0px',
				duration: 1.2,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: banner,
					start: 'top 90%',
					end: 'center center',
					scrub: 1,
				},
			},
		)

		// Внутренний контент баннера
		gsap.fromTo(
			'.banner-content > *',
			{ y: 50, opacity: 0 },
			{
				y: 0,
				opacity: 1,
				duration: 1,
				stagger: 0.2,
				scrollTrigger: {
					trigger: banner,
					start: 'top 75%',
				},
			},
		)
	}

	// 5. Микро-анимации Glassmorphism Header
	const header = document.querySelector('.header')
	if (header) {
		// Исправлен баг: className 'scrolled' вместо 'header-scrolled'
		ScrollTrigger.create({
			start: 'top -50',
			end: 99999,
			toggleClass: { className: 'scrolled', targets: header },
		})

		// Анимация появления элементов шапки (Staggered Load)
		gsap.from('.header-logo, .nav-item, .header-action-btn, .burger-btn', {
			y: -20,
			opacity: 0,
			duration: 0.8,
			stagger: 0.05,
			ease: 'power3.out',
			delay: 0.2,
			clearProps: 'all', // Очищаем пропсы после анимации, чтобы избежать конфликтов на мобильных
		})

		// Магнитные ссылки навигации (только для десктопа)
		if (window.innerWidth > 1024) {
			const navLinks = document.querySelectorAll(
				'.nav-link, .header-action-btn',
			)
			navLinks.forEach(link => {
				link.addEventListener('mousemove', e => {
					const position = link.getBoundingClientRect()
					const x = e.clientX - position.left - position.width / 2
					const y = e.clientY - position.top - position.height / 2

					gsap.to(link, {
						x: x * 0.3,
						y: y * 0.3,
						duration: 0.4,
						ease: 'power2.out',
					})
				})

				link.addEventListener('mouseleave', () => {
					gsap.to(link, {
						x: 0,
						y: 0,
						duration: 0.7,
						ease: 'elastic.out(1, 0.3)',
					})
				})
			})
		}
	}

	// 6. Магнитные кнопки для кнопок-ссылок (отключено)

	// 7. 3D Tilt Effect для карточек (Глобальная функция для динамических элементов)
	window.initTiltEffect = function () {
		const tiltCards = document.querySelectorAll(
			'.info-card, .dealer-card, .car-spec-item, .car-card',
		)

		tiltCards.forEach(card => {
			if (card.dataset.tiltInitialized) return
			card.dataset.tiltInitialized = 'true'

			// Устанавливаем перспективу родительскому контейнеру, если её нет
			if (card.parentElement && !card.parentElement.style.perspective) {
				gsap.set(card.parentElement, { perspective: 1200 })
			}

			gsap.set(card, { transformStyle: 'preserve-3d' })

			card.addEventListener('mousemove', e => {
				const rect = card.getBoundingClientRect()
				// Нормализованные координаты от -1 до 1
				const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
				const y = ((e.clientY - rect.top) / rect.height) * 2 - 1

				// Угол наклона карточки
				const rotateX = y * -10
				const rotateY = x * 10

				gsap.to(card, {
					rotateX: rotateX,
					rotateY: rotateY,
					scale: 1.05,
					duration: 0.4,
					ease: 'power2.out',
				})
			})

			card.addEventListener('mouseleave', () => {
				gsap.to(card, {
					rotateX: 0,
					rotateY: 0,
					scale: 1,
					duration: 0.6,
					ease: 'elastic.out(1, 0.5)',
				})
			})
		})
	}

	// Первичная инициализация 3D карточек
	window.initTiltEffect()
})
