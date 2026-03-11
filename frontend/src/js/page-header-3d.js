/**
 * Global Background 3D Animation (Constellation / Network)
 * Подключается на всех страницах вместо синих градиентов
 */

document.addEventListener('DOMContentLoaded', () => {
	// Инициализируем только один раз
	if (document.getElementById('global-bg-canvas')) return

	// Создаем холст
	const canvas = document.createElement('canvas')
	canvas.id = 'global-bg-canvas'
	canvas.style.position = 'fixed'
	canvas.style.top = '0'
	canvas.style.left = '0'
	canvas.style.width = '100vw'
	canvas.style.height = '100vh'
	canvas.style.zIndex = '-1'
	canvas.style.pointerEvents = 'none'

	// Вставляем самым первым элементом в body
	document.body.insertBefore(canvas, document.body.firstChild)

	// Настройка Three.js
	const scene = new THREE.Scene()
	scene.fog = new THREE.FogExp2(0x020202, 0.0015)

	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		1,
		2000,
	)
	camera.position.z = 400

	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
	})
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setSize(window.innerWidth, window.innerHeight)

	// Создание частиц
	const particleCount = window.innerWidth < 768 ? 100 : 250
	const particles = new THREE.BufferGeometry()
	const positions = new Float32Array(particleCount * 3)
	const velocities = []

	for (let i = 0; i < particleCount; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 1000
		positions[i * 3 + 1] = (Math.random() - 0.5) * 1000
		positions[i * 3 + 2] = (Math.random() - 0.5) * 1000

		velocities.push({
			x: (Math.random() - 0.5) * 0.5,
			y: (Math.random() - 0.5) * 0.5,
			z: (Math.random() - 0.5) * 0.5,
		})
	}

	particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))

	// Материал частиц (узлы BMW синие)
	const pMaterial = new THREE.PointsMaterial({
		color: 0x1c69d4,
		size: 4,
		transparent: true,
		opacity: 0.8,
		map: createCircleTexture(),
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	})

	const particleSystem = new THREE.Points(particles, pMaterial)
	scene.add(particleSystem)

	// Линии (сеть)
	const lineMaterial = new THREE.LineBasicMaterial({
		color: 0x00a8ff,
		transparent: true,
		opacity: 0.15,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	})

	const linesGeometry = new THREE.BufferGeometry()
	const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial)
	scene.add(linesMesh)

	function createCircleTexture() {
		const tempCanvas = document.createElement('canvas')
		tempCanvas.width = 32
		tempCanvas.height = 32
		const context = tempCanvas.getContext('2d')
		const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
		gradient.addColorStop(0, 'rgba(255,255,255,1)')
		gradient.addColorStop(1, 'rgba(255,255,255,0)')
		context.fillStyle = gradient
		context.fillRect(0, 0, 32, 32)
		return new THREE.CanvasTexture(tempCanvas)
	}

	// Интерактивность мыши (Parallax)
	let mouseX = 0
	let mouseY = 0
	let targetX = 0
	let targetY = 0

	window.addEventListener('mousemove', event => {
		mouseX = (event.clientX - window.innerWidth / 2) * 0.5
		mouseY = (event.clientY - window.innerHeight / 2) * 0.5
	})

	window.addEventListener('mouseleave', () => {
		mouseX = 0
		mouseY = 0
	})

	// Animation Loop
	let time = 0
	let animationFrameId

	function animate() {
		animationFrameId = requestAnimationFrame(animate)

		time += 0.002

		// Плавное следование камеры за мышью
		targetX = mouseX * 0.5
		targetY = mouseY * 0.5

		camera.position.x += (targetX - camera.position.x) * 0.05
		camera.position.y += (-targetY - camera.position.y) * 0.05
		camera.lookAt(scene.position)

		const posAttribute = particleSystem.geometry.attributes.position
		const currentPositions = posAttribute.array

		// Вращение всей системы
		particleSystem.rotation.y = time
		linesMesh.rotation.y = time

		// Обновление позиций частиц
		for (let i = 0; i < particleCount; i++) {
			currentPositions[i * 3] += velocities[i].x
			currentPositions[i * 3 + 1] += velocities[i].y
			currentPositions[i * 3 + 2] += velocities[i].z

			// Проверка границ и отскок
			if (Math.abs(currentPositions[i * 3]) > 500) velocities[i].x *= -1
			if (Math.abs(currentPositions[i * 3 + 1]) > 500) velocities[i].y *= -1
			if (Math.abs(currentPositions[i * 3 + 2]) > 500) velocities[i].z *= -1
		}
		posAttribute.needsUpdate = true

		// Построение связей (линий) между близкими частицами
		const linePositions = []
		const maxDistance = 120 // Максимальная дистанция для связи

		for (let i = 0; i < particleCount; i++) {
			for (let j = i + 1; j < particleCount; j++) {
				const dx = currentPositions[i * 3] - currentPositions[j * 3]
				const dy = currentPositions[i * 3 + 1] - currentPositions[j * 3 + 1]
				const dz = currentPositions[i * 3 + 2] - currentPositions[j * 3 + 2]
				const distSq = dx * dx + dy * dy + dz * dz

				if (distSq < maxDistance * maxDistance) {
					linePositions.push(
						currentPositions[i * 3],
						currentPositions[i * 3 + 1],
						currentPositions[i * 3 + 2],
						currentPositions[j * 3],
						currentPositions[j * 3 + 1],
						currentPositions[j * 3 + 2],
					)
				}
			}
		}

		linesMesh.geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(linePositions, 3),
		)

		renderer.render(scene, camera)
	}

	animate()

	// Resize Handling
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	})
})
