/**
 * Banner 3D Animation (Speed Tunnel / Light Streaks Effect)
 * Эффект светового туннеля из удлиненных линий для Banner секции
 */

document.addEventListener('DOMContentLoaded', () => {
	const bannerSections = document.querySelectorAll('.banner-section')

	if (bannerSections.length === 0) return

	bannerSections.forEach(section => {
		// Убедимся, что секция имеет относительное позиционирование
		if (getComputedStyle(section).position === 'static') {
			section.style.position = 'relative'
		}
		section.style.overflow = 'hidden'

		// Элемент контента поднимаем над канвасом
		const container =
			section.querySelector('.container') ||
			section.querySelector('.banner-content')
		if (container) {
			container.style.position = 'relative'
			container.style.zIndex = '2'
		}

		// Создаем холст
		const canvas = document.createElement('canvas')
		canvas.style.position = 'absolute'
		canvas.style.top = '0'
		canvas.style.left = '0'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.zIndex = '1' // Поверх фона, но под текстом
		canvas.style.pointerEvents = 'none'

		section.insertBefore(canvas, section.firstChild)

		// Настройка Three.js
		const scene = new THREE.Scene()

		// Добавляем туман для плавного появления линий вдалеке
		scene.fog = new THREE.FogExp2(0x000000, 0.001)

		const camera = new THREE.PerspectiveCamera(
			60,
			section.offsetWidth / section.offsetHeight,
			1,
			3000,
		)
		camera.position.z = 200

		const renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: true,
			antialias: true,
		})
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		renderer.setSize(section.offsetWidth, section.offsetHeight)

		// Создаем летящие световые линии (Light Streaks)
		const lineCount = window.innerWidth < 768 ? 200 : 500
		const geometry = new THREE.BufferGeometry()
		const positions = new Float32Array(lineCount * 6) // Каждая линия = 2 точки по 3 координаты
		const lineData = []

		for (let i = 0; i < lineCount; i++) {
			// Случайная позиция вокруг центра (цилиндрическое распределение)
			const radius = Math.random() * 800 + 100 // От 100 до 900
			const angle = Math.random() * Math.PI * 2

			const x = Math.cos(angle) * radius
			const y = Math.sin(angle) * radius
			const z = (Math.random() - 0.5) * 2000 // Распределяем в глубину

			// Длина линии (хвост)
			const length = Math.random() * 100 + 50

			// Скорость движения (уменьшена для плавности)
			const speed = Math.random() * 4 + 2

			// Точка 1 (голова)
			positions[i * 6] = x
			positions[i * 6 + 1] = y
			positions[i * 6 + 2] = z

			// Точка 2 (хвост)
			positions[i * 6 + 3] = x
			positions[i * 6 + 4] = y
			positions[i * 6 + 5] = z - length

			lineData.push({
				x,
				y,
				z,
				length,
				speed,
				radius,
				angle,
			})
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

		// Материал для линий
		const material = new THREE.LineBasicMaterial({
			color: 0x1c69d4, // BMW Blue
			transparent: true,
			opacity: 0.6,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		})

		const lineSystem = new THREE.LineSegments(geometry, material)
		scene.add(lineSystem)

		// Интерактивность мыши (Parallax)
		let mouseX = 0
		let mouseY = 0
		let targetX = 0
		let targetY = 0

		section.addEventListener('mousemove', event => {
			const rect = section.getBoundingClientRect()
			mouseX = (event.clientX - rect.left - rect.width / 2) * 0.5
			mouseY = (event.clientY - rect.top - rect.height / 2) * 0.5
		})

		section.addEventListener('mouseleave', () => {
			mouseX = 0
			mouseY = 0
		})

		// Animation Loop
		let animationFrameId
		let time = 0

		function animate() {
			animationFrameId = requestAnimationFrame(animate)
			time += 0.01

			// Плавное движение камеры за мышью
			targetX = mouseX * 0.5
			targetY = mouseY * 0.5

			camera.position.x += (targetX - camera.position.x) * 0.05
			camera.position.y += (-targetY - camera.position.y) * 0.05
			camera.lookAt(scene.position)

			const posAttribute = lineSystem.geometry.attributes.position
			const currentPositions = posAttribute.array

			// Легкое вращение всего туннеля вокруг оси Z
			lineSystem.rotation.z = Math.sin(time * 0.5) * 0.1

			// Обновляем позиции линий
			for (let i = 0; i < lineCount; i++) {
				const data = lineData[i]

				// Двигаем вперед по оси Z (на камеру)
				data.z += data.speed

				// Если линия улетела за камеру, респавним её далеко впереди
				if (data.z > 300) {
					data.z = -1500 - Math.random() * 500
				}

				// Обновляем координаты Vertex
				currentPositions[i * 6] = data.x
				currentPositions[i * 6 + 1] = data.y
				currentPositions[i * 6 + 2] = data.z

				currentPositions[i * 6 + 3] = data.x
				currentPositions[i * 6 + 4] = data.y
				currentPositions[i * 6 + 5] = data.z - data.length
			}
			posAttribute.needsUpdate = true

			renderer.render(scene, camera)
		}

		// Запуск анимации только если секция в области видимости
		let isAnimating = false
		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting && !isAnimating) {
						isAnimating = true
						animate()
					} else if (!entry.isIntersecting && isAnimating) {
						isAnimating = false
						cancelAnimationFrame(animationFrameId)
					}
				})
			},
			{ threshold: 0 },
		)

		observer.observe(section)

		// Resize Handling
		window.addEventListener('resize', () => {
			if (!section) return
			camera.aspect = section.offsetWidth / section.offsetHeight
			camera.updateProjectionMatrix()
			renderer.setSize(section.offsetWidth, section.offsetHeight)
		})
	})
})
