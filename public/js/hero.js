// Cambia la imagen de fondo del hero cada 3 segundos
(function () {
    const slides = document.querySelectorAll('#hero-slides .hero-slide');
    if (slides.length < 2) return;

    let current = 0;
    setInterval(() => {
        slides[current].classList.remove('is-active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('is-active');
    }, 3000);
})();
