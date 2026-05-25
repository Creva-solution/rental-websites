// Artisan Craft Script
document.addEventListener('DOMContentLoaded', () => {
    let count = 0;
    const badge = document.querySelector('.badge');
    const addBtns = document.querySelectorAll('.card button');

    addBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            count++;
            badge.textContent = count;
            btn.textContent = 'Added!';
            setTimeout(() => {
                btn.textContent = 'Add to Cart';
            }, 2000);
        });
    });
});
