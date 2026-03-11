/**
 * Hero 3D Abstract Background (Speed Tunnel / Light Streaks Effect)
 * Эффект светового туннеля из удлиненных линий для Hero секции
 */

document.addEventListener('DOMContentLoaded', () => {
	// Находим контейнер. Ищем или создаем его внутри .hero-bg
	const heroSection = document.querySelector('.hero')
	const heroBg = document.querySelector('.hero-bg')

	if (!heroSection || !heroBg) return

	// Оставляем оригинальный фон
	heroBg.style.position = 'absolute'
	heroBg.style.inset = '0'
	heroBg.style.overflow = 'hidden'

	// Создаем холст
	const canvas = document.createElement('canvas')
	canvas.style.position = 'absolute'
	canvas.style.top = '0'
	canvas.style.left = '0'
	canvas.style.width = '100%'
	canvas.style.height = '100%'
	canvas.style.zIndex = '0' // Должно быть под overlay
	canvas.style.pointerEvents = 'none'

	heroBg.appendChild(canvas)

	// Настройка Three.js
	const scene = new THREE.Scene()
	scene.fog = new THREE.FogExp2(0x000000, 0.001)

	const camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
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
	renderer.setSize(window.innerWidth, window.innerHeight)

	// Создаем летящие световые линии (Light Streaks)
	const lineCount = window.innerWidth < 768 ? 300 : 700
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

	const windowHalfX = window.innerWidth / 2
	const windowHalfY = window.innerHeight / 2

	document.addEventListener('mousemove', event => {
		mouseX = (event.clientX - windowHalfX) * 0.5
		mouseY = (event.clientY - windowHalfY) * 0.5
	})

	document.addEventListener('mouseleave', () => {
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

	observer.observe(heroSection)

	// Resize Handling
	window.addEventListener('resize', () => {
		if (!heroSection) return
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	})
})
