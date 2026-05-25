// Minimal Elegance Script
document.addEventListener('DOMContentLoaded', () => {
    console.log('Minimal Elegance Template Loaded');

    // Add simple click handler for cart
    const cartBtn = document.querySelector('.cart');
    let itemCount = 0;

    window.addToCart = () => {
        itemCount++;
        cartBtn.textContent = `Cart (${itemCount})`;
        alert('Product added to cart!');
    };
});
