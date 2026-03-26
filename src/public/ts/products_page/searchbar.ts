const searchInput = document.getElementById('productSearchInput') as HTMLInputElement | null;

// Use optional chaining (?) to ensure we only add the listener if the input exists
searchInput?.addEventListener('input', (e: Event) => {
    // Cast e.target to HTMLInputElement so TypeScript knows 'value' exists
    const target = e.target as HTMLInputElement;
    const searchTerm = target.value.toLowerCase();
    
    const container = document.getElementById('scannedProductsContainer');
    if (!container) return;

    // Convert NodeList to Array to use forEach safely if needed, 
    // and specify these are HTMLDivElements
    const productCards = container.querySelectorAll(':scope > div');

    productCards.forEach((card) => {
        // Use type assertion and optional chaining for the sub-elements
        const productName = (card.querySelector('h3') as HTMLElement | null)?.textContent?.toLowerCase() || "";
        const barcode = (card.querySelector('.font-mono') as HTMLElement | null)?.textContent?.toLowerCase() || "";

        const isVisible = productName.includes(searchTerm) || barcode.includes(searchTerm);
        
        // Use classList.toggle with a force boolean for cleaner code
        (card as HTMLElement).classList.toggle('hidden', !isVisible);
    });
});