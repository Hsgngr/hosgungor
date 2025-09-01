function initializeHeaderInteractions() {
  const hamMenuBtn = document.querySelector('.header__main-ham-menu-cont')
  const smallMenu = document.querySelector('.header__sm-menu')
  const headerHamMenuBtn = document.querySelector('.header__main-ham-menu')
  const headerHamMenuCloseBtn = document.querySelector(
    '.header__main-ham-menu-close'
  )
  const headerSmallMenuLinks = document.querySelectorAll('.header__sm-menu-link')

  if (!hamMenuBtn || !smallMenu || !headerHamMenuBtn || !headerHamMenuCloseBtn) {
    return
  }

  hamMenuBtn.addEventListener('click', () => {
    if (smallMenu.classList.contains('header__sm-menu--active')) {
      smallMenu.classList.remove('header__sm-menu--active')
    } else {
      smallMenu.classList.add('header__sm-menu--active')
    }
    if (headerHamMenuBtn.classList.contains('d-none')) {
      headerHamMenuBtn.classList.remove('d-none')
      headerHamMenuCloseBtn.classList.add('d-none')
    } else {
      headerHamMenuBtn.classList.add('d-none')
      headerHamMenuCloseBtn.classList.remove('d-none')
    }
  })

  for (let i = 0; i < headerSmallMenuLinks.length; i++) {
    headerSmallMenuLinks[i].addEventListener('click', (e) => {
      const target = e.target.closest('[data-scroll-target]')
      if (target) {
        e.preventDefault()
        const selector = target.getAttribute('data-scroll-target')
        const el = document.querySelector(selector)
        if (el) {
          const innerHeading = el.querySelector('.heading-sec__main')
          const anchorEl = innerHeading || el
          const y = anchorEl.getBoundingClientRect().top + window.scrollY - 110
          history.pushState(null, '', `${location.pathname}${selector}`)
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
      smallMenu.classList.remove('header__sm-menu--active')
      headerHamMenuBtn.classList.remove('d-none')
      headerHamMenuCloseBtn.classList.add('d-none')
    })
  }

  const headerLogoConatiner = document.querySelector('.header__logo-container')
  if (headerLogoConatiner) {
    headerLogoConatiner.addEventListener('click', () => {
      location.href = '/index.html'
    })
  }
}

document.addEventListener('componentsLoaded', () => {
  initializeHeaderInteractions()
  const blogLinks = document.querySelectorAll('[data-scroll-target="#blog"]')
  blogLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const el = document.querySelector('#blog')
      if (el) {
        const innerHeading = el.querySelector('.heading-sec__main')
        const anchorEl = innerHeading || el
        const y = anchorEl.getBoundingClientRect().top + window.scrollY - 110
        history.pushState(null, '', `${location.pathname}#blog`)
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    })
  })
})
