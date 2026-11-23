import { openCamera, startDecoding, StopScanning } from "./_BarcodeReader";

// The same barcode only counts again once it has been out of view for this long,
// so holding a product in front of the camera never counts it twice.
const SAME_CODE_GAP_MS = 1500;
// After a successful scan, ignore everything for this long so the next item
// isn't picked up before you're ready. Raise it if scanning still feels too quick.
const PAUSE_AFTER_SCAN_MS = 1500;

class CameraScanner {
    private stream: MediaStream | null = null;
    private stopDecoding: StopScanning | null = null;
    private isOpen = false;
    private lastCode = "";
    private lastCodeAt = 0;
    private pausedUntil = 0;
    private resumeTimer: number | undefined;

    constructor(
        private openButton: HTMLButtonElement,
        private modal: HTMLDivElement,
        private video: HTMLVideoElement,
        private status: HTMLParagraphElement,
        private closeButton: HTMLButtonElement,
        private barcodeForm: HTMLFormElement,
        private barcodeInput: HTMLInputElement,
    ) {
        this.openButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.open();
        });
        this.closeButton.addEventListener("click", () => this.close());
        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) this.close();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.isOpen) this.close();
        });
    }

    private async open(): Promise<void> {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            alert("Kameraet kræver HTTPS (eller localhost) og en browser med kameraadgang.");
            return;
        }

        if (this.isOpen) return;
        this.isOpen = true;
        this.modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden"); // stop the page scrolling behind the camera
        this.modal.dispatchEvent(new Event("camera:open"));
        this.setStatus("Starter kamera...");

        try {
            const stream = await openCamera();
            // The user may have closed the window while waiting for camera permission.
            if (!this.isOpen) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            this.stream = stream;
            const stop = await startDecoding(stream, this.video, (code) => this.handleCode(code));
            if (!this.isOpen) {
                stop();
                return;
            }
            this.stopDecoding = stop;
            this.setStatus("Hold stregkoden foran kameraet");
        } catch (error) {
            console.error("Could not start camera:", error);
            this.setStatus("Kunne ikke starte kameraet. Tjek at siden har tilladelse til at bruge kameraet.");
        }
    }

    public close(): void {
        this.isOpen = false;
        window.clearTimeout(this.resumeTimer);
        this.pausedUntil = 0;
        this.showScanned(false);
        this.stopDecoding?.();
        this.stopDecoding = null;
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.video.srcObject = null;
        this.modal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
        this.modal.dispatchEvent(new Event("camera:close"));
    }

    private handleCode(code: string): void {
        const now = Date.now();
        const isRepeat = code === this.lastCode && now - this.lastCodeAt < SAME_CODE_GAP_MS;
        this.lastCode = code;
        this.lastCodeAt = now;
        if (isRepeat || now < this.pausedUntil) return;

        this.pausedUntil = now + PAUSE_AFTER_SCAN_MS;
        this.showScanned(true);
        window.clearTimeout(this.resumeTimer);
        this.resumeTimer = window.setTimeout(() => {
            this.showScanned(false);
            if (this.isOpen) this.setStatus(`${this.status.textContent} – Klar`);
        }, PAUSE_AFTER_SCAN_MS);

        navigator.vibrate?.(100);
        this.barcodeInput.value = code;
        this.barcodeForm.requestSubmit();

        const item = document.getElementById(code);
        const name = item?.querySelector(".product-name")?.textContent;
        const count = item?.querySelector(".count")?.textContent;
        this.setStatus(name ? `${name} (antal: ${count})` : `Scannet: ${code}`);

        // Unknown product: the create-product modal opened, so get out of its way.
        const addProductModal = document.getElementById("addProductModal");
        if (addProductModal && !addProductModal.classList.contains("hidden")) {
            this.close();
        }
    }

    /** Turns the aim box green while scanning is paused after a successful scan. */
    private showScanned(scanned: boolean): void {
        const aimBox = document.getElementById("cameraAimBox");
        aimBox?.classList.toggle("border-green-500", scanned);
        aimBox?.classList.toggle("border-4", scanned);
        aimBox?.classList.toggle("border-red-500/80", !scanned);
        aimBox?.classList.toggle("border-2", !scanned);
    }

    public setStatus(text: string): void {
        this.status.textContent = text;
    }
}

export { CameraScanner };
