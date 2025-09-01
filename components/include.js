document.addEventListener('DOMContentLoaded', () => {
  const includeTargets = document.querySelectorAll('[data-include]')
  const includePromises = Array.from(includeTargets).map(async (element) => {
    const includePath = element.getAttribute('data-include')
    try {
      const response = await fetch(includePath, { cache: 'no-cache' })
      const html = await response.text()
      element.innerHTML = html
    } catch (error) {
      element.innerHTML = ''
      // Silently fail; optional: console.warn('Include failed for', includePath, error)
    }
  })

  Promise.all(includePromises).then(() => {
    document.dispatchEvent(new Event('componentsLoaded'))
  })
})


