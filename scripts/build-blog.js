// Build blog pages and posts.json from markdown files under blog/posts
// Usage: node scripts/build-blog.js

const fs = require('fs')
const path = require('path')

function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) return { data: {}, content: markdown }
  let end = markdown.indexOf('\n---', 3)
  let fm = ''
  let rest = ''
  if (end !== -1) {
    fm = markdown.slice(3, end).trim()
    rest = markdown.slice(end + 4).replace(/^\s*\n/, '')
  } else {
    // No closing '---' found. Treat everything after '---' as front matter.
    fm = markdown.slice(3).trim()
    rest = ''
  }
  const data = {}
  const lines = fm.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let value = m[2]
    if (value === '' && i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
      // YAML array block
      const arr = []
      i++
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*-\s+/, '')
        arr.push(item.replace(/^"|"$/g, ''))
        i++
      }
      i--
      data[key] = arr
    } else {
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      data[key] = value
    }
  }
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

function generateTitleFromSlug(slug) {
  return slug
    .replace(/[\-_]+/g, ' ')
    .split(' ')
    .map((w) => {
      if (w.toUpperCase() === w) return w // preserve acronyms like AI
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

function build() {
  const postsDir = path.join(process.cwd(), 'blog', 'posts')
  const outDir = path.join(process.cwd(), 'blog')
  const headerHtml = fs.readFileSync(path.join(process.cwd(), 'components', 'header.html'), 'utf8')
  const footerHtml = fs.readFileSync(path.join(process.cwd(), 'components', 'footer.html'), 'utf8')
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const postsMeta = []

  files.forEach((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const md = fs.readFileSync(path.join(postsDir, filename), 'utf8')
    const { data, content } = parseFrontMatter(md)

    // get first image and strip it (used as cover)
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/
    const imgMatch = content.match(imgRegex)
    const image = data.cover_image || data.coverimage || (imgMatch ? imgMatch[1] : '')
    const contentClean = imgMatch ? content.replace(imgMatch[0], '') : content

    const html = toHtml(contentClean)
    const title = data.title || generateTitleFromSlug(slug)
    const date = formatDate(data.date || new Date().toISOString())
    const tags = Array.isArray(data.tags) ? data.tags : (data.tag ? [data.tag] : [])

    // write HTML page with static header/footer to avoid include flicker
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
  ${headerHtml}
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
  ${footerHtml}
</body>
</html>`

    fs.writeFileSync(path.join(outDir, `${slug}.html`), page)

    const excerpt = data.description && String(data.description).trim().length > 0
      ? data.description
      : contentClean
          .replace(/---[\s\S]*?---/, '') // strip any accidental front-matter text
          .replace(/!\[[^\]]*\]\([^\)]*\)/g, '') // strip images
          .replace(/\[[^\]]*\]\([^\)]*\)/g, '') // strip links
          .replace(/[#*_`>]/g, '') // strip markdown tokens
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 180)
    postsMeta.push({ slug, title, date, tags, excerpt, image })
  })

  // sort by date desc
  postsMeta.sort((a, b) => (a.date < b.date ? 1 : -1))
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(postsMeta, null, 2))
}

build()


