// Inline shared components (header/footer) into static pages while keeping
// components/header.html and components/footer.html as the single source of truth.
// Usage: node scripts/inline-components.js

const fs = require('fs')
const path = require('path')

function inlineComponents(filePath, headerHtml, footerHtml) {
  let html = fs.readFileSync(filePath, 'utf8')
  // Replace first <header ...>...</header>
  html = html.replace(/<header[\s\S]*?<\/header>/, headerHtml.trim())
  // Replace first <footer ...>...</footer>
  html = html.replace(/<footer[\s\S]*?<\/footer>/, footerHtml.trim())
  fs.writeFileSync(filePath, html)
}

function run() {
  const root = process.cwd()
  const headerHtml = fs.readFileSync(path.join(root, 'components', 'header.html'), 'utf8')
  const footerHtml = fs.readFileSync(path.join(root, 'components', 'footer.html'), 'utf8')
  const targets = [
    path.join(root, 'index.html'),
    path.join(root, 'blog', 'index.html'),
    path.join(root, 'projects', 'index.html'),
  ]
  targets.forEach((f) => inlineComponents(f, headerHtml, footerHtml))
}

run()


