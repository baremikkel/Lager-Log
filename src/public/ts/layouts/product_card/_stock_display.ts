// Inventory is stored as individual pieces (stk). A product's `stock` is how many
// pieces one package holds (e.g. 24 cans), so scanning a package adds that many.

function packageText(amount: number, perPackage: number): string {
    if (perPackage <= 1) return '';
    const full = Math.floor(amount / perPackage);
    const loose = amount % perPackage;
    const packages = `${full} ${full === 1 ? 'pakke' : 'pakker'} à ${perPackage}`;
    return loose > 0 ? `= ${packages} + ${loose} løse` : `= ${packages}`;
}

/** Re-renders a product card's amount from its data-amount and data-stock attributes. */
function renderStock(card: HTMLElement): void {
    const amount = parseInt(card.dataset.amount || '0');
    const perPackage = parseInt(card.dataset.stock || '1');

    const amountEl = card.querySelector('.product-amount');
    if (amountEl) amountEl.textContent = amount.toString();

    const perPackageEl = card.querySelector('.product-per-package');
    if (perPackageEl) perPackageEl.textContent = `${perPackage} stk pr pakke`;

    const text = packageText(amount, perPackage);
    const packagesEl = card.querySelector('.package-display') as HTMLElement | null;
    if (packagesEl) {
        packagesEl.textContent = text;
        // Only shown after the amount has been clicked (see togglePackages).
        packagesEl.classList.toggle('hidden', text === '' || card.dataset.showPackages !== 'true');
    }

    const toggleEl = card.querySelector('.stock-toggle');
    if (toggleEl) {
        const clickable = text !== '';
        toggleEl.classList.toggle('cursor-pointer', clickable);
        toggleEl.classList.toggle('underline', clickable);
        toggleEl.classList.toggle('cursor-default', !clickable);
    }
}

/** Shows or hides the "= 2 pakker à 24" line when the amount is clicked. */
function togglePackages(card: HTMLElement): void {
    card.dataset.showPackages = card.dataset.showPackages === 'true' ? 'false' : 'true';
    renderStock(card);
}

export { renderStock, togglePackages };
