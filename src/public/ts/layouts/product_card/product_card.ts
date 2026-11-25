import { openEditModal } from "./edit_products";
import { renderStock, togglePackages } from "./_stock_display";

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

    document.querySelectorAll('.stock-toggle').forEach((toggle: Element) => {
        toggle.addEventListener('click', (event: Event) => {
            event.stopPropagation();
            const card = toggle.closest('.card') as HTMLElement | null;
            if (card) togglePackages(card);
        });
    });

    document.querySelectorAll('.bg-white').forEach((card: Element) => {
        card.addEventListener('click', (event: Event) => {
            if ((event.target as HTMLElement).closest('button')) return;
            
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

            const currentAmount = Math.max(0, parseInt(card.dataset.amount || '0') + delta);
            card.dataset.amount = currentAmount.toString();
            renderStock(card);
        } else {
            alert('Failed to update inventory');
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Error updating inventory');
    }
}