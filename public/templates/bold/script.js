// Bold Commerce Script
document.addEventListener('DOMContentLoaded', () => {
    let count = 0;
    const countDisplay = document.getElementById('cart-count');
    const btns = document.querySelectorAll('.add-btn');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            count++;
            countDisplay.textContent = count;
            btn.style.background = '#ff3e3e';
            btn.style.color = '#fff';
            btn.textContent = 'DONE';
            setTimeout(() => {
                btn.style.background = '#fff';
                btn.style.color = '#000';
                btn.textContent = 'QUICK ADD';
            }, 1000);
        });
    });
});
