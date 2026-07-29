(() => {
  document.querySelectorAll('[data-toggle-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.toggleTarget);
      if (!target) return;
      target.classList.toggle('show');
      button.setAttribute('aria-expanded', target.classList.contains('show'));
    });
  });

  const progress = document.querySelector('[data-scroll-progress]');
  if (progress) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    };
    addEventListener('scroll', update, {passive:true});
    update();
  }
})();