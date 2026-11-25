import { openEditModal } from "./edit_products";
import { renderStock, togglePackages } from "./_stock_display";
import { addPendingChange, hasPendingPanel, setupPendingChanges } from "./_pending_changes";

document.addEventListener('DOMContentLoaded', () => {
    setupPendingChanges();

    const wireStepButtons = (selector: string, step: number) => {
        document.querySelectorAll(selector).forEach((btn: Element) => {
            btn.addEventListener('click', async (event: Event) => {
                event.preventDefault();
                const button = event.currentTarget as HTMLButtonElement;
                const productId = button.getAttribute('data-product-id');
                if (!productId) return;
                // Pages with an approval list collect changes instead of saving them.
                if (hasPendingPanel()) addPendingChange(productId, step);
                else await updateInventory(parseInt(productId), step, button);
            });
        });
    };
    wireStepButtons('.increase-btn', 1);
    wireStepButtons('.decrease-btn', -1);

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
        // Same endpoint on every page (category pages live under /category/:id).
        const response = await fetch('/api/inventory/update', {
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