// Build blog pages and posts.json from markdown files under blog/posts
// Usage: node scripts/build-blog.js

const fs = require('fs')
const path = require('path')

function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) return { data: {}, content: markdown }
  const end = markdown.indexOf('\n---', 3)
  if (end === -1) return { data: {}, content: markdown }
  const fm = markdown.slice(3, end).trim()
  const rest = markdown.slice(end + 4).replace(/^\s*\n/, '')
  const data = {}
  fm.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/)
    if (!m) return
    const key = m[1]
    let value = m[2]
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    data[key] = value
  })
  return { data, content: rest }
}

function toHtml(markdown) {
  // minimal markdown -> html converter for headings, paragraphs, images, links, code
  let html = markdown
    .replace(/^###\s+(.*)$/gm, '<h3>$1<\/h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1<\/h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1<\/h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
    .replace(/\*(.*?)\*/g, '<em>$1<\/em>')
    .replace(/`([^`]+)`/g, '<code>$1<\/code>')
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '<img src="$1" alt="" \/>')
    .replace(/\n{2,}/g, '</p><p>')
  html = '<p>' + html + '</p>'
  return html
}

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

function build() {
  const postsDir = path.join(process.cwd(), 'blog', 'posts')
  const outDir = path.join(process.cwd(), 'blog')
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const postsMeta = []

  files.forEach((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const md = fs.readFileSync(path.join(postsDir, filename), 'utf8')
    const { data, content } = parseFrontMatter(md)
    const html = toHtml(content)
    const title = data.title || slug
    const date = formatDate(data.date || new Date().toISOString())
    const tag = (data.tags && Array.isArray(data.tags) && data.tags[0]) || data.tag || ''

    // try to extract first image
    const imgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    const image = data.cover_image || (imgMatch ? imgMatch[1] : '')

    // write HTML page
    const page = `<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${title}</title>\n  <link rel="icon" type="image/png" href="../assets/png/hosgungor_portfolio_icon7.png" />\n  <link rel="stylesheet" href="../css/style.css" />\n  <link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap" rel="stylesheet" />\n</head>\n<body>\n  <div data-include="../components/header.html"></div>\n  <section class="sec-pad">\n    <div class="main-container">\n      <h1 class="heading heading-sec__main">${title}</h1>\n      <div class="markdown-content" style="margin-top:2rem;max-width:70rem;">${html}</div>\n    </div>\n  </section>\n  <div data-include="../components/footer.html"></div>\n  <script src="../components/include.js"></script>\n</body>\n</html>`

    fs.writeFileSync(path.join(outDir, `${slug}.html`), page)

    postsMeta.push({ slug, title, date, tag, excerpt: data.description || '', image })
  })

  // sort by date desc
  postsMeta.sort((a, b) => (a.date < b.date ? 1 : -1))
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(postsMeta, null, 2))
}

build()


