function formatDate(isoString) {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return isoString
  }
}

function renderBlogCard(post) {
  const link = post.slug ? `/blog/${post.slug}.html` : (post.href || '#')
  return `
  <article class="blog-card">
    <a href="${link}" class="blog-card__image-link">
      <img src="${post.image}" alt="${post.title}" class="blog-card__image" loading="lazy" />
    </a>
    <div class="blog-card__meta">
      <span class="blog-card__date">${formatDate(post.date)}</span>
      <span class="blog-card__tag">${post.tag}</span>
    </div>
    <h3 class="blog-card__title"><a href="${link}">${post.title}</a></h3>
    <p class="blog-card__excerpt">${post.excerpt}</p>
  </article>
  `
}

async function fetchPostsJson() {
  const attempts = [
    '/blog/posts.json',
    './blog/posts.json',
    '../blog/posts.json'
  ]
  for (const url of attempts) {
    try {
      const res = await fetch(url, { cache: 'no-cache' })
      if (res.ok) return res.json()
    } catch (_) {
      // try next
    }
  }
  return []
}

async function mountBlogCards(targetSelector, limit) {
  try {
    const container = document.querySelector(targetSelector)
    if (!container) return
    // Skip if already rendered
    if (container.getAttribute('data-rendered') === 'true') return
    const posts = await fetchPostsJson()
    const items = (Array.isArray(posts) ? posts : []).slice(0, limit || posts.length)
    container.innerHTML = items.map(renderBlogCard).join('')
    container.setAttribute('data-rendered', 'true')
  } catch (e) {
    // Silently ignore; container stays empty
  }
}

function mountAllBlogSections() {
  mountBlogCards('#blog .blog-cards', 3)
  mountBlogCards('#blog-list', undefined)
}

document.addEventListener('componentsLoaded', mountAllBlogSections)
document.addEventListener('DOMContentLoaded', mountAllBlogSections)


