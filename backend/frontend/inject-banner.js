const fs = require('fs')
const path = require('path')
const frontendDir = path.join(__dirname)

function injectInto(filePath) {
	let content = fs.readFileSync(filePath, 'utf8')
	if (content.includes('banner-section') && !content.includes('banner-3d.js')) {
		const isPagesDir =
			filePath.includes('pages\\') || filePath.includes('pages/')
		const scriptPath = isPagesDir
			? '../src/js/banner-3d.js'
			: 'src/js/banner-3d.js'

		// Inject before </body>
		content = content.replace(
			'</body>',
			`\t<script src="${scriptPath}"></script>\n\t</body>`,
		)
		fs.writeFileSync(filePath, content)
		console.log('Injected into ' + path.basename(filePath))
	}
}

// Check index.html
injectInto(path.join(frontendDir, 'index.html'))

// Check files in pages/
const pagesDir = path.join(frontendDir, 'pages')
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'))
files.forEach(file => {
	injectInto(path.join(pagesDir, file))
})
