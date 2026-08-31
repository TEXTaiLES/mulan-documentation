document.addEventListener('DOMContentLoaded', function () {
  const footer = document.querySelector('.md-footer-meta__inner')
  if (!footer) return

  footer.addEventListener('click', function (event) {
    const bounds = footer.getBoundingClientRect()
    if (event.clientX - bounds.left <= Math.min(300, bounds.width / 3)) {
      window.open('https://www.athenarc.gr/', '_blank', 'noopener')
    }
  })
})

