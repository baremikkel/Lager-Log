const searchInput = document.getElementById('productSearchInput') as HTMLInputElement | null;

searchInput?.addEventListener('input', (e: Event) => {

    const target = e.target as HTMLInputElement;
    const searchTerm = target.value.toLowerCase();
    
    const container = document.getElementById('scannedProductsContainer');
    if (!container) return;

    const productCards = container.querySelectorAll(':scope > div');

    productCards.forEach((card) => {
        const productName = (card.querySelector('h3') as HTMLElement | null)?.textContent?.toLowerCase() || "";
        const barcode = (card.querySelector('.font-mono') as HTMLElement | null)?.textContent?.toLowerCase() || "";
        const isVisible = productName.includes(searchTerm) || barcode.includes(searchTerm);
        (card as HTMLElement).classList.toggle('hidden', !isVisible);
    });
});