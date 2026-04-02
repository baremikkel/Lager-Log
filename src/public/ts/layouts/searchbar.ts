const searchInput = document.getElementById('productSearchInput') as HTMLInputElement | null;

searchInput?.addEventListener('input', (e: Event) => {

    const target = e.target as HTMLInputElement;
    const searchTerm = target.value.toLowerCase();
    
    const container = document.getElementById('productContainer');
    if (!container) return;

    const productCards = container.querySelectorAll('.card');

    productCards.forEach((card) => {
        const productName = (card.querySelector('h3') as HTMLElement | null)?.textContent?.toLowerCase() || "";
        const barcode = (card.querySelector('.font-mono') as HTMLElement | null)?.textContent?.toLowerCase() || "";
        const categoriesJson = (card as HTMLElement).getAttribute('data-categories') || '[]';
        
        let categories: string[] = [];
        try {
            categories = JSON.parse(categoriesJson).map((cat: string) => cat.toLowerCase());
        } catch (e) {
            categories = [];
        }
        
        const matchesCategory = categories.some(cat => cat.includes(searchTerm));
        const isVisible = productName.includes(searchTerm) || barcode.includes(searchTerm) || matchesCategory;
        (card as HTMLElement).classList.toggle('hidden', !isVisible);
    });
});