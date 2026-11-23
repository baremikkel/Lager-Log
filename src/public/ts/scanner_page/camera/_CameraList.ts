// Moves the page's scanned-products list into the camera window while it is open,
// and back again when it closes. Moving (not copying) keeps every id, count and
// +/- handler intact, so the rest of the scanner page code works unchanged.
class CameraList {
    private placeholder = document.createComment("scanned-products-list");
    private originalClassName: string;
    private observer: MutationObserver;

    constructor(
        modal: HTMLDivElement,
        private listContainer: HTMLDivElement,
        private listHeader: HTMLDivElement,
        private slot: HTMLDivElement,
        private emptyText: HTMLParagraphElement,
    ) {
        this.originalClassName = listContainer.className;
        this.observer = new MutationObserver((mutations) => {
            this.updateEmptyText();
            const added = mutations.flatMap((m) => [...m.addedNodes]).pop();
            if (added instanceof HTMLElement) added.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });

        modal.addEventListener("camera:open", () => this.attach());
        modal.addEventListener("camera:close", () => this.detach());
    }

    private attach(): void {
        if (this.listContainer.parentNode === this.slot) return;
        this.listContainer.parentNode?.insertBefore(this.placeholder, this.listContainer);
        this.listContainer.className = "w-full";
        this.listHeader.classList.add("hidden");
        this.slot.appendChild(this.listContainer);

        this.observer.observe(this.listContainer, { childList: true });
        this.updateEmptyText();
    }

    private detach(): void {
        if (!this.placeholder.parentNode) return;
        this.observer.disconnect();
        this.placeholder.parentNode.replaceChild(this.listContainer, this.placeholder);
        this.listContainer.className = this.originalClassName;
        this.listHeader.classList.remove("hidden");
    }

    private updateEmptyText(): void {
        const hasItems = this.listContainer.querySelector(".item-container") !== null;
        this.emptyText.classList.toggle("hidden", hasItems);
    }
}

export { CameraList };
