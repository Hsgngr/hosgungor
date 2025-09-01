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
    .replace(/\n{2,}/g, '<\/p><p>')
  html = '<p>' + html + '<\/p>'
  // Convert image syntax after paragraph conversion to keep placement reasonable
  html = html.replace(/!\[[^\]]*\]\(([^)]+)\)/g, '<img src="$1" alt="" \/>')
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

    // get first image and strip it (used as cover)
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/
    const imgMatch = content.match(imgRegex)
    const image = data.cover_image || (imgMatch ? imgMatch[1] : '')
    const contentClean = imgMatch ? content.replace(imgMatch[0], '') : content

    const html = toHtml(contentClean)
    const title = data.title || slug
    const date = formatDate(data.date || new Date().toISOString())
    const tag = (data.tags && Array.isArray(data.tags) && data.tags[0]) || data.tag || ''

    // write HTML page
    const page = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="icon" type="image/png" href="../assets/png/hosgungor_portfolio_icon7.png" />
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap" rel="stylesheet" />
</head>
<body>
  <div data-include="../components/header.html"></div>
  <section class="sec-pad">
    <div class="main-container">
      <a href="/blog/" class="blog-back-link">← Back to blog</a>
      <div class="blog-post">
        <h1 class="blog-post__title">${title}</h1>
        ${data.description ? `<p class=\"blog-post__desc\">${data.description}</p>` : ''}
        ${image ? `<img class=\"blog-post__cover\" src=\"${image}\" alt=\"${title}\"/>` : ''}
        <div class="markdown-content blog-post__content">${html}</div>
      </div>
    </div>
  </section>
  <div data-include="../components/footer.html"></div>
  <script src="../components/include.js"></script>
</body>
</html>`

    fs.writeFileSync(path.join(outDir, `${slug}.html`), page)

    postsMeta.push({ slug, title, date, tag, excerpt: data.description || '', image })
  })

  // sort by date desc
  postsMeta.sort((a, b) => (a.date < b.date ? 1 : -1))
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(postsMeta, null, 2))
}

build()


