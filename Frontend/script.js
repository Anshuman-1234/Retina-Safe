// Basic interactivity for Retina Safe
document.addEventListener('DOMContentLoaded', () => {
    console.log('Retina Safe Initialized');

    // Smooth scroll for nav links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple interaction for CTA
    const mainCta = document.querySelector('.btn-primary.glow');
    if (mainCta) {
        mainCta.addEventListener('click', () => {
            alert('Vision tracking will begin shortly. Ensure your lighting is optimized!');
        });
    }
});
