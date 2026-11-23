// Buttons inside the camera window that forward to the page's own buttons,
// so the behaviour stays identical to using the page directly.
class CameraControls {
    constructor(
        private cameraModeButton: HTMLButtonElement,
        private pageModeButton: HTMLButtonElement,
        cameraSendButton: HTMLButtonElement,
        pageSendButton: HTMLButtonElement,
        cameraDoneButton: HTMLButtonElement,
        onDone: () => void,
        private onStatus: (text: string) => void,
    ) {
        this.cameraModeButton.addEventListener("click", () => this.pageModeButton.click());
        new MutationObserver(() => this.syncMode()).observe(this.pageModeButton, {
            attributes: true,
            attributeFilter: ["data-mode"],
        });
        this.syncMode();

        cameraSendButton.addEventListener("click", () => {
            const itemCount = document.querySelectorAll("#scannedProductsContainer .item-container").length;
            if (itemCount === 0) {
                this.onStatus("Listen er tom");
                return;
            }
            if (!confirm(`Send listen med ${itemCount} vare(r)?`)) return;
            pageSendButton.click();
            this.onStatus("Listen er sendt");
        });

        cameraDoneButton.addEventListener("click", onDone);
    }

    private syncMode(): void {
        const isAdd = this.pageModeButton.getAttribute("data-mode") !== "remove";
        this.cameraModeButton.textContent = isAdd ? "Tilføj Mode" : "Fjern Mode";
        this.cameraModeButton.classList.toggle("bg-green-400", isAdd);
        this.cameraModeButton.classList.toggle("bg-red-400", !isAdd);
    }
}

export { CameraControls };
