const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, 'pages')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'))

files.forEach(file => {
	const filePath = path.join(dir, file)
	let content = fs.readFileSync(filePath, 'utf8')
	if (
		content.includes('page-header') &&
		!content.includes('page-header-3d.js')
	) {
		content = content.replace(
			'<script src="../src/js/animations.js"></script>',
			'<script src="../src/js/animations.js"></script>\n\t\t<script src="../src/js/page-header-3d.js"></script>',
		)
		fs.writeFileSync(filePath, content)
		console.log('Injected into ' + file)
	}
})
