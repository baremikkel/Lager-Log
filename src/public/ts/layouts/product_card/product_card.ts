import { openEditModal } from "./edit_products";

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.increase-btn').forEach((btn: Element) => {
        btn.addEventListener('click', async (event: Event) => {
            event.preventDefault();
            const button = event.target as HTMLButtonElement;
            const productId = button.getAttribute('data-product-id');
            if (productId) {
                await updateInventory(parseInt(productId), 1, button);
            }
        });
    });

    document.querySelectorAll('.decrease-btn').forEach((btn: Element) => {
        btn.addEventListener('click', async (event: Event) => {
            event.preventDefault();
            const button = event.target as HTMLButtonElement;
            const productId = button.getAttribute('data-product-id');
            if (productId) {
                await updateInventory(parseInt(productId), -1, button);
            }
        });
    });

    document.querySelectorAll('.bg-white').forEach((card: Element) => {
        card.addEventListener('click', (event: Event) => {
            if ((event.target as HTMLElement).tagName === 'BUTTON') return;
            
            const productCard = card as HTMLElement;
            const productId = productCard.id.replace('product_card_', '');
            openEditModal(productId);
        });
    });
});

async function updateInventory(productId: number, delta: number, btn: HTMLButtonElement): Promise<void> {
    try {
        const response = await fetch('api' + window.location.pathname + '/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId, delta }),
        });
        if (response.ok) {
            const card = btn.closest('#product_card_' + productId) as HTMLElement;
            if (!card) return;

            const amountEl = card.querySelector('.product-amount') as HTMLElement;
            if (!amountEl) return;

            let currentAmount = parseInt(amountEl.textContent?.trim() || '0');
            currentAmount += delta;
            if (currentAmount < 0) currentAmount = 0;
            amountEl.textContent = currentAmount.toString();

            const totalEl = card.querySelector('.total-display') as HTMLElement;
            if (!totalEl) return;

            const stock = parseInt(card.getAttribute('data-stock') || '0');
            totalEl.textContent = `(${stock * currentAmount} stk på lager)`;
        } else {
            alert('Failed to update inventory');
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Error updating inventory');
    }
}