/**
 * Custom Magnetic Cursor
 * Создает плавный шлейф и инверсирует цвета при наведении
 */

document.addEventListener('DOMContentLoaded', () => {
	// Проверяем, не мобильное ли это устройство
	if (window.innerWidth <= 768 || 'ontouchstart' in window) {
		return
	}

	// Создаем элементы курсора
	const cursorOuter = document.createElement('div')
	const cursorInner = document.createElement('div')

	cursorOuter.classList.add('custom-cursor', 'cursor-outer')
	cursorInner.classList.add('custom-cursor', 'cursor-inner')

	// Критически важно для предотвращения бага с огромным скроллом страницы
	const cursorStyles = `
		position: fixed;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 9999;
		transform: translate(-50%, -50%);
	`
	cursorOuter.style.cssText = cursorStyles
	cursorInner.style.cssText = cursorStyles

	document.body.appendChild(cursorOuter)
	document.body.appendChild(cursorInner)

	// GSAP настройки для плавной интерполяции
	const cursor = {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
		outerX: window.innerWidth / 2,
		outerY: window.innerHeight / 2,
	}

	let isHovering = false

	// Обновляем координаты при движении мыши
	window.addEventListener('mousemove', e => {
		cursor.x = e.clientX
		cursor.y = e.clientY

		// Мгновенное перемещение внутренней точки
		gsap.to(cursorInner, {
			x: cursor.x,
			y: cursor.y,
			duration: 0.1,
			ease: 'power2.out',
		})

		// Плавное следование внешнего кольца
		gsap.to(cursorOuter, {
			x: cursor.x,
			y: cursor.y,
			duration: 0.5,
			ease: 'power3.out',
		})
	})

	// Эффекты при наведении на интерактивные элементы
	const interactiveElements = document.querySelectorAll(
		'a, button, .interactive, input, textarea, select, .info-card, .dealer-card',
	)

	interactiveElements.forEach(el => {
		el.addEventListener('mouseenter', () => {
			isHovering = true
			cursorOuter.classList.add('cursor-hover')
			cursorInner.classList.add('cursor-hover')

			// Легкий магнитный эффект для кнопок
			if (
				el.classList.contains('btn') ||
				el.tagName.toLowerCase() === 'button'
			) {
				gsap.to(cursorOuter, { scale: 1.5, duration: 0.3 })
				gsap.to(cursorInner, { scale: 0, duration: 0.3 }) // Скрываем точку внутри
			} else {
				gsap.to(cursorOuter, { scale: 1.2, duration: 0.3 })
			}
		})

		el.addEventListener('mouseleave', () => {
			isHovering = false
			cursorOuter.classList.remove('cursor-hover')
			cursorInner.classList.remove('cursor-hover')

			gsap.to(cursorOuter, { scale: 1, duration: 0.3 })
			gsap.to(cursorInner, { scale: 1, duration: 0.3 })
		})
	})

	// Очищаем стили при уходе мыши за пределы окна
	document.body.addEventListener('mouseleave', () => {
		gsap.to([cursorOuter, cursorInner], { opacity: 0, duration: 0.3 })
	})

	document.body.addEventListener('mouseenter', () => {
		gsap.to([cursorOuter, cursorInner], { opacity: 1, duration: 0.3 })
	})
})
