// On pages with a #pendingChanges panel ("Alle Produkter"), +/- does not save right away.
// Changes are collected per product and only saved when the user presses "Godkend".
// The panel is docked at the bottom as a collapsed bar that opens when clicked.
import { renderStock } from "./_stock_display";

const pending = new Map<string, number>(); // product id -> change in pieces
let isOpen = false;
let leaveTarget: string | null = null; // link the user tried to follow while changes were unsaved

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

function hasPendingPanel(): boolean {
    return byId('pendingChanges') !== null;
}

function cardFor(productId: string): HTMLElement | null {
    return byId(`product_card_${productId}`);
}

function savedAmount(card: HTMLElement): number {
    return parseInt(card.dataset.amount || '0');
}

function formatDelta(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
}

function productsText(count: number): string {
    return `${count} ${count === 1 ? 'ændring' : 'ændringer'}`;
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

function renderCardBadge(card: HTMLElement): void {
    const badge = card.querySelector('.pending-badge') as HTMLElement | null;
    if (!badge) return;
    const delta = pending.get(card.id.replace('product_card_', '')) || 0;
    badge.textContent = delta ? `(${formatDelta(delta)})` : '';
    badge.classList.toggle('hidden', delta === 0);
    badge.classList.toggle('text-green-600', delta > 0);
    badge.classList.toggle('text-red-600', delta < 0);
}

function renderList(): void {
    const list = byId('pendingList');
    const template = byId<HTMLTemplateElement>('pendingItemTemplate');
    if (!list || !template) return;

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
}

function render(): void {
    const panel = byId('pendingChanges');
    if (!panel) return;
    const hasChanges = pending.size > 0;

    renderList();

    const count = byId('pendingCount');
    if (count) {
        count.textContent = pending.size.toString();
        count.classList.toggle('bg-amber-400', hasChanges);
        count.classList.toggle('text-white', hasChanges);
        count.classList.toggle('bg-slate-200', !hasChanges);
        count.classList.toggle('text-slate-600', !hasChanges);
    }
    byId('pendingEmpty')?.classList.toggle('hidden', hasChanges);
    for (const id of ['pendingApprove', 'pendingCancel']) {
        const button = byId<HTMLButtonElement>(id);
        if (button) button.disabled = !hasChanges;
    }

    byId('pendingBody')?.classList.toggle('hidden', !isOpen);
    byId('pendingToggle')?.setAttribute('aria-expanded', String(isOpen));
    const chevron = byId('pendingChevron');
    if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';

    // Keep the last cards reachable above the docked panel.
    document.body.style.paddingBottom = `${panel.offsetHeight + 16}px`;

    document.querySelectorAll<HTMLElement>('.card').forEach(renderCardBadge);
}

/** Saves all pending changes. Returns true when everything was saved. */
async function approve(): Promise<boolean> {
    const button = byId<HTMLButtonElement>('pendingApprove');
    if (button) button.disabled = true;
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
        return true;
    } catch (error) {
        console.error('Error saving pending changes:', error);
        alert('Nogle ændringer kunne ikke gemmes. De står stadig på listen.');
        return false;
    } finally {
        render();
    }
}

// Leaving the page ------------------------------------------------------------

function openLeaveDialog(href: string): void {
    leaveTarget = href;
    const count = byId('leaveDialogCount');
    if (count) count.textContent = productsText(pending.size);
    byId('leaveDialog')?.classList.remove('hidden');
    byId('leaveSave')?.focus();
}

function closeLeaveDialog(): void {
    leaveTarget = null;
    byId('leaveDialog')?.classList.add('hidden');
}

function leave(): void {
    const target = leaveTarget;
    closeLeaveDialog();
    if (target) window.location.href = target;
}

function setupLeaveWarning(): void {
    // Links inside the app (e.g. the navigation bar) ask whether to save first.
    document.addEventListener('click', (event) => {
        if (pending.size === 0) return;
        const mouse = event as MouseEvent;
        if (mouse.button !== 0 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey) return;
        const link = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
        if (!link || link.target === '_blank' || link.getAttribute('href')?.startsWith('#')) return;
        event.preventDefault();
        openLeaveDialog(link.href);
    }, true);

    byId('leaveSave')?.addEventListener('click', async () => {
        const button = byId<HTMLButtonElement>('leaveSave');
        if (button) button.disabled = true;
        const saved = await approve();
        if (button) button.disabled = false;
        if (saved) leave();
    });
    byId('leaveDiscard')?.addEventListener('click', () => {
        pending.clear();
        render();
        leave();
    });
    byId('leaveStay')?.addEventListener('click', closeLeaveDialog);
    byId('leaveDialog')?.addEventListener('click', (event) => {
        if (event.target === event.currentTarget) closeLeaveDialog();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && leaveTarget) closeLeaveDialog();
    });

    // Closing the tab, reloading or typing a new address: browsers only allow their own
    // "Leave site?" warning here, not a custom question.
    window.addEventListener('beforeunload', (event) => {
        if (pending.size > 0) event.preventDefault();
    });
}

function setupPendingChanges(): void {
    if (!hasPendingPanel()) return;
    byId('pendingToggle')?.addEventListener('click', () => {
        isOpen = !isOpen;
        render();
    });
    byId('pendingApprove')?.addEventListener('click', () => void approve());
    byId('pendingCancel')?.addEventListener('click', () => {
        pending.clear();
        render();
    });
    setupLeaveWarning();
    render();
}

export { hasPendingPanel, addPendingChange, setupPendingChanges };
