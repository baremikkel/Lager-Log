// On pages with a #pendingChanges panel ("Alle Produkter"), +/- does not save right away.
// Changes are collected per product and only saved when the user presses "Godkend".
import { renderStock } from "./_stock_display";

const pending = new Map<string, number>(); // product id -> change in pieces

function hasPendingPanel(): boolean {
    return document.getElementById('pendingChanges') !== null;
}

function cardFor(productId: string): HTMLElement | null {
    return document.getElementById(`product_card_${productId}`);
}

function savedAmount(card: HTMLElement): number {
    return parseInt(card.dataset.amount || '0');
}

function formatDelta(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
}

/** Adds +1/-1 to a product's pending change. The result can never go below 0 pieces. */
function addPendingChange(productId: string, step: number): void {
    const card = cardFor(productId);
    if (!card) return;

    const current = pending.get(productId) || 0;
    const next = Math.max(-savedAmount(card), current + step);
    if (next === 0) pending.delete(productId);
    else pending.set(productId, next);

    render();
}

function renderCardBadge(productId: string): void {
    const card = cardFor(productId);
    const badge = card?.querySelector('.pending-badge') as HTMLElement | null;
    if (!badge) return;
    const delta = pending.get(productId) || 0;
    badge.textContent = delta ? `(${formatDelta(delta)})` : '';
    badge.classList.toggle('hidden', delta === 0);
    badge.classList.toggle('text-green-600', delta > 0);
    badge.classList.toggle('text-red-600', delta < 0);
}

function render(): void {
    const panel = document.getElementById('pendingChanges') as HTMLElement;
    const list = document.getElementById('pendingList') as HTMLElement;
    const template = document.getElementById('pendingItemTemplate') as HTMLTemplateElement;
    const count = document.getElementById('pendingCount') as HTMLElement;
    if (!panel || !list || !template) return;

    list.replaceChildren();
    for (const [productId, delta] of pending) {
        const card = cardFor(productId);
        if (!card) continue;
        const item = template.content.cloneNode(true) as DocumentFragment;
        const from = savedAmount(card);
        (item.querySelector('.pending-name') as HTMLElement).textContent =
            card.querySelector('h3')?.textContent?.trim() || '';
        (item.querySelector('.pending-from-to') as HTMLElement).textContent = `${from} → ${from + delta} stk`;
        const deltaEl = item.querySelector('.pending-delta') as HTMLElement;
        deltaEl.textContent = formatDelta(delta);
        deltaEl.classList.add(delta > 0 ? 'text-green-600' : 'text-red-600');
        item.querySelector('.pending-remove')?.addEventListener('click', () => {
            pending.delete(productId);
            render();
        });
        list.appendChild(item);
    }

    if (count) count.textContent = `${pending.size} ${pending.size === 1 ? 'produkt' : 'produkter'}`;
    panel.classList.toggle('hidden', pending.size === 0);
    // Keep the last cards reachable above the panel.
    document.body.style.paddingBottom = pending.size ? `${panel.offsetHeight + 16}px` : '';

    document.querySelectorAll<HTMLElement>('.card').forEach((card) =>
        renderCardBadge(card.id.replace('product_card_', '')),
    );
}

async function approve(): Promise<void> {
    const button = document.getElementById('pendingApprove') as HTMLButtonElement;
    button.disabled = true;
    try {
        for (const [productId, delta] of [...pending]) {
            const response = await fetch('/api/products/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: parseInt(productId), delta }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const card = cardFor(productId);
            if (card) {
                card.dataset.amount = Math.max(0, savedAmount(card) + delta).toString();
                renderStock(card);
            }
            pending.delete(productId);
        }
    } catch (error) {
        console.error('Error saving pending changes:', error);
        alert('Nogle ændringer kunne ikke gemmes. De står stadig på listen.');
    } finally {
        button.disabled = false;
        render();
    }
}

function setupPendingChanges(): void {
    if (!hasPendingPanel()) return;
    document.getElementById('pendingApprove')?.addEventListener('click', approve);
    document.getElementById('pendingCancel')?.addEventListener('click', () => {
        pending.clear();
        render();
    });
    window.addEventListener('beforeunload', (event) => {
        if (pending.size > 0) event.preventDefault();
    });
}

export { hasPendingPanel, addPendingChange, setupPendingChanges };
