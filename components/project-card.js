function renderProjectCard(project) {
  const link = project.href && project.href !== '#' ? project.href : `/projects/${project.slug}.html`
  const tagsHtml = Array.isArray(project.tags) && project.tags.length
    ? `<span class="blog-card__tags">${project.tags.map(t => `<span class=\"blog-card__tag\">${t}</span>`).join('')}</span>`
    : ''
  return `
  <article class="blog-card">
    <a href="${link}" class="blog-card__image-link" target="_blank" rel="noreferrer">
      <img src="${project.image}" alt="${project.title}" class="blog-card__image" loading="lazy" />
    </a>
    <div class="blog-card__meta">
      ${tagsHtml}
    </div>
    <h3 class="blog-card__title"><a href="${link}" target="_blank" rel="noreferrer">${project.title}</a></h3>
    <p class="blog-card__excerpt">${project.excerpt}</p>
  </article>
  `
}

async function fetchProjectsJson() {
  const attempts = [
    '/projects/projects.json',
    './projects/projects.json',
    '../projects/projects.json'
  ]
  for (const url of attempts) {
    try {
      const res = await fetch(url, { cache: 'no-cache' })
      if (res.ok) return res.json()
    } catch (_) {}
  }
  return []
}

async function mountProjectCards(targetSelector, limit) {
  try {
    const container = document.querySelector(targetSelector)
    if (!container) return
    if (container.getAttribute('data-rendered') === 'true') return
    const projects = await fetchProjectsJson()
    const items = (Array.isArray(projects) ? projects : []).slice(0, limit || projects.length)
    container.innerHTML = items.map(renderProjectCard).join('')
    container.setAttribute('data-rendered', 'true')
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  mountProjectCards('#projects .blog-cards')
})


