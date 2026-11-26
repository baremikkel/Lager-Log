import { openCamera, startDecoding, StopScanning } from "./_BarcodeReader";

// The same barcode only counts again once it has been out of view for this long,
// so holding a product in front of the camera never counts it twice.
const SAME_CODE_GAP_MS = 1500;
// After a successful scan, ignore everything for this long so the next item
// isn't picked up before you're ready. Raise it if scanning still feels too quick.
const PAUSE_AFTER_SCAN_MS = 1500;

type CameraCapabilities = MediaTrackCapabilities & {
    torch?: boolean;
    zoom?: { min: number; max: number };
    focusMode?: string[];
    pointsOfInterest?: unknown;
};

class CameraScanner {
    private stream: MediaStream | null = null;
    private stopDecoding: StopScanning | null = null;
    private isOpen = false;
    private lastCode = "";
    private lastCodeAt = 0;
    private pausedUntil = 0;
    private resumeTimer: number | undefined;
    private refocusTimer: number | undefined;
    private focusRingTimer: number | undefined;

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
            const aimBox = document.getElementById("cameraAimBox");
            const stop = await startDecoding(stream, this.video, aimBox, (code) => this.handleCode(code));
            if (!this.isOpen) {
                stop();
                return;
            }
            this.stopDecoding = stop;
            this.setStatus("Hold stregkoden foran kameraet");
            // Some phones (e.g. Samsung) only report light/zoom/focus once the video is running.
            await this.setupCameraButtons(stream);
        } catch (error) {
            console.error("Could not start camera:", error);
            this.setStatus("Kunne ikke starte kameraet. Tjek at siden har tilladelse til at bruge kameraet.");
        }
    }

    /**
     * Shows a light (torch) button and a zoom button when the camera supports them, and lets
     * the user tap the picture to focus there.
     * Light helps in dim rooms and on dark packaging. Zoom (starting at 1x) lets people hold the
     * item further away, where phones can focus, while the barcode still fills the aim box.
     */
    private async setupCameraButtons(stream: MediaStream): Promise<void> {
        const [track] = stream.getVideoTracks();
        if (!track) return;
        let capabilities = this.capabilitiesOf(track);
        if (!capabilities.torch && !capabilities.zoom) {
            // Give slow cameras a moment to report what they can do.
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (!this.isOpen) return;
            capabilities = this.capabilitiesOf(track);
        }
        const apply = (constraint: Record<string, unknown>) =>
            track.applyConstraints({ advanced: [constraint as MediaTrackConstraintSet] });

        this.setupTapToFocus(track, capabilities, apply);

        const torchButton = document.getElementById("cameraTorchButton") as HTMLButtonElement | null;
        if (torchButton) {
            let torchOn = false;
            const hasTorch = capabilities.torch === true || (await this.hasFlashViaImageCapture(track));
            torchButton.classList.toggle("hidden", !hasTorch);
            torchButton.setAttribute("aria-pressed", "false");
            torchButton.classList.remove("bg-yellow-400/80");
            torchButton.onclick = async () => {
                try {
                    await apply({ torch: !torchOn });
                    torchOn = !torchOn;
                    torchButton.setAttribute("aria-pressed", String(torchOn));
                    torchButton.setAttribute("aria-label", torchOn ? "Sluk lys" : "Tænd lys");
                    torchButton.classList.toggle("bg-yellow-400/80", torchOn);
                } catch (error) {
                    console.warn("Could not switch the light:", error);
                }
            };
        }

        const zoomButton = document.getElementById("cameraZoomButton") as HTMLButtonElement | null;
        if (zoomButton) {
            const zoom = capabilities.zoom;
            const levels = zoom ? [1, 2, 3].filter((level) => level >= zoom.min && level <= zoom.max) : [];
            zoomButton.classList.toggle("hidden", levels.length < 2);
            let index = 0;
            zoomButton.textContent = "1x";
            zoomButton.onclick = async () => {
                const next = (index + 1) % levels.length;
                try {
                    await apply({ zoom: levels[next] });
                    index = next;
                    zoomButton.textContent = `${levels[next]}x`;
                } catch (error) {
                    console.warn("Could not change zoom:", error);
                }
            };
        }
    }

    private capabilitiesOf(track: MediaStreamTrack): CameraCapabilities {
        return (track.getCapabilities?.() ?? {}) as CameraCapabilities;
    }

    /** Chrome on some Android phones only reports the light through the ImageCapture API. */
    private async hasFlashViaImageCapture(track: MediaStreamTrack): Promise<boolean> {
        const ImageCaptureClass = (window as unknown as {
            ImageCapture?: new (track: MediaStreamTrack) => { getPhotoCapabilities(): Promise<{ fillLightMode?: string[] }> };
        }).ImageCapture;
        if (!ImageCaptureClass) return false;
        try {
            const photo = await new ImageCaptureClass(track).getPhotoCapabilities();
            return photo.fillLightMode?.includes("flash") ?? false;
        } catch {
            return false;
        }
    }

    /**
     * Tapping the picture focuses on that spot (where the phone allows it) and shows a ring there.
     * After a few seconds the camera goes back to focusing by itself.
     */
    private setupTapToFocus(
        track: MediaStreamTrack,
        capabilities: CameraCapabilities,
        apply: (constraint: Record<string, unknown>) => Promise<void>,
    ): void {
        const modes = capabilities.focusMode ?? [];
        const settings = (track.getSettings?.() ?? {}) as Record<string, unknown>;
        const canPoint = "pointsOfInterest" in settings || "pointsOfInterest" in capabilities;
        const canFocus = canPoint || modes.includes("single-shot") || modes.includes("continuous");
        const ring = document.getElementById("cameraFocusRing");

        this.video.onclick = async (event: MouseEvent) => {
            if (!canFocus) return;
            const rect = this.video.getBoundingClientRect();
            const { videoWidth, videoHeight } = this.video;
            if (!videoWidth || !videoHeight) return;

            if (ring) {
                ring.style.left = `${event.clientX - rect.left}px`;
                ring.style.top = `${event.clientY - rect.top}px`;
                ring.classList.remove("hidden");
                window.clearTimeout(this.focusRingTimer);
                this.focusRingTimer = window.setTimeout(() => ring.classList.add("hidden"), 1200);
            }

            // The video uses object-fit: cover, so map the tap to a point in the full camera picture (0–1).
            const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
            const x = ((event.clientX - rect.left) / scale + (videoWidth - rect.width / scale) / 2) / videoWidth;
            const y = ((event.clientY - rect.top) / scale + (videoHeight - rect.height / scale) / 2) / videoHeight;

            const focus: Record<string, unknown> = {};
            if (canPoint) focus.pointsOfInterest = [{ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }];
            // Asking for focus again makes most phones refocus now.
            if (modes.includes("single-shot")) focus.focusMode = "single-shot";
            else if (modes.includes("continuous")) focus.focusMode = "continuous";
            try {
                await apply(focus);
            } catch (error) {
                console.warn("Tap to focus is not supported here:", error);
                return;
            }

            window.clearTimeout(this.refocusTimer);
            if (focus.focusMode === "single-shot" && modes.includes("continuous")) {
                this.refocusTimer = window.setTimeout(() => {
                    if (this.isOpen) apply({ focusMode: "continuous" }).catch(() => undefined);
                }, 4000);
            }
        };
    }

    public close(): void {
        window.clearTimeout(this.refocusTimer);
        window.clearTimeout(this.focusRingTimer);
        this.video.onclick = null;
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
