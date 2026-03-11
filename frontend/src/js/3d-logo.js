/**
 * 3D-Логотип BMW WebGL (Ultra-Realistic Edition)
 * Создание фотореалистичного 3D-бейджа с использованием CanvasTexture и MeshPhysicalMaterial
 */

document.addEventListener('DOMContentLoaded', () => {
	const logoContainers = document.querySelectorAll(
		'.header-logo, .footer-logo, .mobile-menu-logo',
	)

	logoContainers.forEach(container => {
		container.innerHTML = ''
		container.style.width = '70px'
		container.style.height = '70px'
		container.style.position = 'relative'

		// 1. Инициализация сцены Three.js
		const scene = new THREE.Scene()
		const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
		camera.position.z = 3.5 // Приблизим камеру к бейджу

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
		renderer.setSize(65, 65)
		renderer.setPixelRatio(window.devicePixelRatio)
		container.appendChild(renderer.domElement)

		const logoGroup = new THREE.Group()

		// 2. ГЕНЕРАЦИЯ ТЕКСТУРЫ ЧЕРЕЗ HTML5 CANVAS
		function createBMWTexture() {
			const size = 2048 // 2K разрешение для максимального сглаживания (antialias)
			const canvas = document.createElement('canvas')
			canvas.width = size
			canvas.height = size
			const ctx = canvas.getContext('2d')
			const center = size / 2

			// Очистка
			ctx.clearRect(0, 0, size, size)

			// 2.1. Внешнее черное кольцо
			ctx.beginPath()
			ctx.arc(center, center, center - 20, 0, Math.PI * 2)
			ctx.fillStyle = '#0a0a0a'
			ctx.fill()

			// Внешняя серебряная окантовка (Edge light)
			ctx.lineWidth = 20
			const outerGradient = ctx.createLinearGradient(0, 0, size, size)
			outerGradient.addColorStop(0, '#ffffff')
			outerGradient.addColorStop(0.5, '#7a7a7a')
			outerGradient.addColorStop(1, '#ffffff')
			ctx.strokeStyle = outerGradient
			ctx.stroke()

			// 2.2. Надпись "B M W"
			ctx.save()
			ctx.translate(center, center)
			ctx.fillStyle = '#ffffff'
			ctx.font = 'bold 340px "Inter", Arial, sans-serif'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'

			const radiusText = center * 0.68
			const chars = ['B', 'M', 'W']
			const angles = [-Math.PI / 4, 0, Math.PI / 4]

			for (let i = 0; i < chars.length; i++) {
				ctx.save()
				ctx.rotate(angles[i])
				ctx.fillText(chars[i], 0, -radiusText + 15) // Смещаем чуть вниз из-за увеличения шрифта
				ctx.restore()
			}
			ctx.restore()

			// 2.3. Внутреннее серебряное кольцо (Разделитель)
			const innerRadius = center * 0.52
			ctx.beginPath()
			ctx.arc(center, center, innerRadius, 0, Math.PI * 2)
			ctx.lineWidth = 15
			const innerGradient = ctx.createLinearGradient(0, size, size, 0)
			innerGradient.addColorStop(0, '#ffffff')
			innerGradient.addColorStop(0.5, '#555555')
			innerGradient.addColorStop(1, '#ffffff')
			ctx.strokeStyle = innerGradient
			ctx.stroke()

			// 2.4. Внутренние сектора (Пропеллер)
			// Радиус секторов чуть меньше внутреннего кольца, чтобы не было зазоров
			const sectorRadius = innerRadius - 6

			const blueGradient = ctx.createRadialGradient(
				center,
				center,
				0,
				center,
				center,
				sectorRadius,
			)
			blueGradient.addColorStop(0, '#4293f5')
			blueGradient.addColorStop(1, '#0e4185')

			const whiteGradient = ctx.createRadialGradient(
				center,
				center,
				0,
				center,
				center,
				sectorRadius,
			)
			whiteGradient.addColorStop(0, '#ffffff')
			whiteGradient.addColorStop(1, '#e0e0e0')

			// Верх-Лево (Белый)
			ctx.beginPath()
			ctx.moveTo(center, center)
			ctx.arc(center, center, sectorRadius, Math.PI, Math.PI * 1.5)
			ctx.fillStyle = whiteGradient
			ctx.fill()

			// Верх-Право (Синий)
			ctx.beginPath()
			ctx.moveTo(center, center)
			ctx.arc(center, center, sectorRadius, Math.PI * 1.5, Math.PI * 2)
			ctx.fillStyle = blueGradient
			ctx.fill()

			// Низ-Право (Белый)
			ctx.beginPath()
			ctx.moveTo(center, center)
			ctx.arc(center, center, sectorRadius, 0, Math.PI * 0.5)
			ctx.fillStyle = whiteGradient
			ctx.fill()

			// Низ-Лево (Синий)
			ctx.beginPath()
			ctx.moveTo(center, center)
			ctx.arc(center, center, sectorRadius, Math.PI * 0.5, Math.PI)
			ctx.fillStyle = blueGradient
			ctx.fill()

			// Создаем Three.js текстуру из Canvas
			const texture = new THREE.CanvasTexture(canvas)
			texture.anisotropy = renderer.capabilities.getMaxAnisotropy() // Максимальная резкость под углом
			texture.colorSpace = THREE.SRGBColorSpace // Правильная цветопередача (Three.js r152+)

			// Поворачиваем текстуру на 90 градусов налево (в Three.js это положительный угол)
			texture.center.set(0.5, 0.5)
			texture.rotation = Math.PI / 2

			texture.needsUpdate = true // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ТЕКСТУРЫ
			return texture
		}

		// 3. СОЗДАНИЕ 3D ГЕОМЕТРИИ (МОНЕТА / БЕЙДЖ)
		const radius = 1.4
		const thickness = 0.15
		// Цилиндр (Монета). Меняем сегменты с 64 на 128 для идеального сглаживания контуров
		const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 128)
		// Поворачиваем цилиндр, чтобы он смотрел на зрителя фронтально (плоскость XY)
		geometry.rotateX(Math.PI / 2)

		// 4. МАТЕРИАЛЫ
		const bmwTexture = createBMWTexture()

		// Фронтальная часть бейджа (Глянцевая эмаль)
		const frontMaterial = new THREE.MeshBasicMaterial({
			map: bmwTexture,
			transparent: true,
			alphaTest: 0.1,
		})

		// Задняя часть бейджа
		const backMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			roughness: 0.9,
			metalness: 0.1,
		})

		// Боковины монеты (Возвращаем хромированный металл, так как полоски были из-за масштаба)
		const sideMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			metalness: 1.0,
			roughness: 0.1,
		})

		// В CylinderGeometry:
		// Index 0: Side (Торцы)
		// Index 1: Top (Фронт, т.к. мы повернули X на 90 градусов)
		// Index 2: Bottom (Задняя часть)
		const materials = [sideMaterial, frontMaterial, backMaterial]

		const badge = new THREE.Mesh(geometry, materials)
		logoGroup.add(badge)

		// Увеличиваем масштаб логотипа до желаемого размера (1.2).
		// Ранее этот размер обрезался холстом, но теперь сам Canvas увеличен до 65px.
		logoGroup.scale.set(1, 1, 1)

		scene.add(logoGroup)

		// 5. ОСВЕЩЕНИЕ (Studio Lighting setup для металлических боковин)
		const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
		scene.add(ambientLight)

		// Основной свет спереди-слева
		const mainLight = new THREE.DirectionalLight(0xffffff, 3.0)
		mainLight.position.set(-5, 5, 5)
		scene.add(mainLight)

		// Подсветка сверху (создает яркий блик на хроме)
		const fillLight = new THREE.DirectionalLight(0xffffff, 3.0)
		fillLight.position.set(0, 10, 0)
		scene.add(fillLight)

		// Синий контровый свет
		const rimLight = new THREE.PointLight(0x4293f5, 8, 15)
		rimLight.position.set(5, -5, 5)
		scene.add(rimLight)

		// 6. ИНТЕРАКТИВНОСТЬ: ВРАЩЕНИЕ И РЕАКЦИЯ НА КУРСОР
		let targetRotationX = 0
		let targetRotationY = 0
		let isHovered = false

		const clock = new THREE.Clock()

		container.addEventListener('mouseenter', () => {
			isHovered = true
			document.body.style.cursor = 'pointer'
		})

		container.addEventListener('mousemove', e => {
			if (!isHovered) return
			const rect = container.getBoundingClientRect()
			const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
			const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1

			// Ограничиваем угол наклона при ховере (эффект магнита)
			targetRotationY = nx * 0.5
			targetRotationX = ny * 0.5
		})

		container.addEventListener('mouseleave', () => {
			isHovered = false
			targetRotationX = 0
			targetRotationY = 0
			document.body.style.cursor = 'default'
		})

		container.style.cursor = 'pointer'
		container.addEventListener('click', () => {
			window.location.href = '/'
		})

		// Убедимся, что начальное положение логотипа правильное
		logoGroup.rotation.y = 0
		logoGroup.rotation.x = 0

		// 7. АНИМАЦИОННЫЙ ЦИКЛ
		function animate() {
			requestAnimationFrame(animate)

			if (isHovered) {
				// Плавное следование за курсором
				logoGroup.rotation.y += (targetRotationY - logoGroup.rotation.y) * 0.15
				logoGroup.rotation.x += (targetRotationX - logoGroup.rotation.x) * 0.15
			} else {
				// В состоянии покоя логотип плавно возвращается в нулевую позицию (по X)
				// и еле заметно покачивается вокруг оси Y, чтобы был виден хром
				logoGroup.rotation.x += (0 - logoGroup.rotation.x) * 0.05
				logoGroup.rotation.y = Math.sin(clock.getElapsedTime()) * 0.15 // Покачивание вместо бесконечного вращения ребрами
			}

			renderer.render(scene, camera)
		}

		animate()
	})
})
