// Generate project detail pages from projects/projects.json
// Also enrich from optional markdown at projects/posts/<slug>.md (same as blog pipeline)
// Only creates pages for projects without an external href (href omitted or '#')
// Usage: node scripts/build-projects.js

const fs = require('fs')
const path = require('path')

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) return { data: {}, content: markdown }
  let end = markdown.indexOf('\n---', 3)
  let fm = ''
  let rest = ''
  if (end !== -1) {
    fm = markdown.slice(3, end).trim()
    rest = markdown.slice(end + 4).replace(/^\s*\n/, '')
  } else {
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
  const blocks = markdown.split(/\n{2,}/)
  const html = blocks.map((block) => {
    const lines = block.split(/\n/)
    const nonEmpty = lines.filter((l) => l.trim() !== '')
    const isList = nonEmpty.length > 0 && nonEmpty.every((l) => /^[-*]\s+/.test(l.trim()))
    if (isList) {
      const items = lines
        .filter((l) => /^[-*]\s+/.test(l.trim()))
        .map((l) => l.replace(/^[-*]\s+/, ''))
        .map((i) => {
          let li = i
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
            .replace(/\*(.*?)\*/g, '<em>$1<\/em>')
            .replace(/`([^`]+)`/g, '<code>$1<\/code>')
          li = li.replace(/!\[[^\]]*\]\(([^)]+)\)/g, '<img src="$1" alt="" \/>')
          return `<li>${li}<\/li>`
        })
        .join('')
      return `<ul>${items}<\/ul>`
    }
    let h = block
      .replace(/^###\s+(.*)$/gm, '<h3>$1<\/h3>')
      .replace(/^##\s+(.*)$/gm, '<h2>$1<\/h2>')
      .replace(/^#\s+(.*)$/gm, '<h1>$1<\/h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
      .replace(/\*(.*?)\*/g, '<em>$1<\/em>')
      .replace(/`([^`]+)`/g, '<code>$1<\/code>')
    h = h.replace(/!\[[^\]]*\]\(([^)]+)\)/g, '<img src="$1" alt="" \/>')
    return `<p>${h}<\/p>`
  }).join('')
  return html
}

function embedYouTube(html) {
  // Match youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
  const patterns = [
    /https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{6,})[^\s<]*/g,
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})[^\s<]*/g,
    /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})[^\s<]*/g,
  ]
  let out = html
  for (const re of patterns) {
    out = out.replace(re, (_, id) => `
      <div class="embed-youtube">
        <iframe src="https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
    `)
  }
  return out
}

function build() {
  const root = process.cwd()
  const projectsPath = path.join(root, 'projects', 'projects.json')
  const outDir = path.join(root, 'projects')
  const headerHtml = fs.readFileSync(path.join(root, 'components', 'header.html'), 'utf8')
  const footerHtml = fs.readFileSync(path.join(root, 'components', 'footer.html'), 'utf8')
  const projects = readJson(projectsPath)

  projects.forEach((p) => {
    if (p.href && p.href !== '#') return
    let title = p.title || p.slug
    let image = p.image || ''
    let excerpt = p.excerpt || ''
    let tags = Array.isArray(p.tags) ? p.tags : []

    // optional markdown at projects/posts/<slug>.md
    const mdPath = path.join(root, 'projects', 'posts', `${p.slug}.md`)
    let contentHtml = ''
    if (fs.existsSync(mdPath)) {
      const md = fs.readFileSync(mdPath, 'utf8')
      const { data, content } = parseFrontMatter(md)
      if (data.title) title = data.title
      if (data.description) excerpt = data.description
      if (data.cover_image || data.coverimage) image = data.cover_image || data.coverimage
      if (Array.isArray(data.tags)) tags = data.tags
      const imgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
      const contentClean = imgMatch ? content.replace(imgMatch[0], '') : content
      contentHtml = embedYouTube(toHtml(contentClean))
    }

    const tagsHtml = tags.length
      ? `<span class="blog-card__tags">${tags.map(t => `<span class=\"blog-card__tag\">${escapeHtml(t)}</span>`).join('')}</span>`
      : ''

    const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ege's Portfolio</title>
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
      <a href="/projects/" class="blog-back-link">← Back to projects</a>
      <div class="blog-post">
        <h1 class="blog-post__title">${escapeHtml(title)}</h1>
        ${excerpt ? `<p class=\"blog-post__desc\">${escapeHtml(excerpt)}</p>` : ''}
        ${image ? `<img class=\"blog-post__cover\" src=\"${image}\" alt=\"${escapeHtml(title)}\"/>` : ''}
        ${tagsHtml}
        <div class="markdown-content blog-post__content">${contentHtml}</div>
      </div>
    </div>
  </section>
  ${footerHtml}
</body>
</html>`

    fs.writeFileSync(path.join(outDir, `${p.slug}.html`), page)
  })
}

build()


