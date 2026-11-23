import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

// Only the 1D formats used on products. Fewer formats = faster, fewer misreads.
const ZXING_FORMATS = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
];
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

const SCAN_INTERVAL_MS = 100;

// Minimal typing for the browser's built-in BarcodeDetector (Chrome on Android).
interface NativeBarcodeDetector {
    detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
interface NativeBarcodeDetectorConstructor {
    new (options: { formats: string[] }): NativeBarcodeDetector;
    getSupportedFormats(): Promise<string[]>;
}

export interface StopScanning {
    (): void;
}

/** Opens the rear camera with phone-friendly settings. */
export async function openCamera(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: { ideal: "environment" },
            // Phones often default to 640x480, which is too few pixels for thin barcode bars.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
        },
    });

    const [track] = stream.getVideoTracks();
    const capabilities = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { focusMode?: string[] };
    if (capabilities.focusMode?.includes("continuous")) {
        try {
            await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
        } catch {
            // Not supported on this device; keep the default focus.
        }
    }
    return stream;
}

/**
 * Continuously decodes barcodes from the stream shown in `video`.
 * Uses the built-in BarcodeDetector when available (much faster and more reliable on Android),
 * otherwise falls back to ZXing.
 */
export async function startDecoding(
    stream: MediaStream,
    video: HTMLVideoElement,
    onCode: (code: string) => void,
): Promise<StopScanning> {
    const native = await createNativeDetector();
    if (native) return decodeNative(native, stream, video, onCode);
    return decodeZxing(stream, video, onCode);
}

async function createNativeDetector(): Promise<NativeBarcodeDetector | null> {
    const Detector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) return null;
    try {
        const supported = await Detector.getSupportedFormats();
        const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
        return formats.length > 0 ? new Detector({ formats }) : null;
    } catch {
        return null;
    }
}

async function decodeNative(
    detector: NativeBarcodeDetector,
    stream: MediaStream,
    video: HTMLVideoElement,
    onCode: (code: string) => void,
): Promise<StopScanning> {
    video.srcObject = stream;
    await video.play();

    let stopped = false;
    let timeoutId: number | undefined;
    const loop = async () => {
        if (stopped) return;
        try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                const [barcode] = await detector.detect(video);
                if (barcode && !stopped) onCode(barcode.rawValue);
            }
        } catch (error) {
            console.warn("BarcodeDetector failed:", error);
        }
        if (!stopped) timeoutId = window.setTimeout(loop, SCAN_INTERVAL_MS);
    };
    loop();

    return () => {
        stopped = true;
        window.clearTimeout(timeoutId);
    };
}

async function decodeZxing(
    stream: MediaStream,
    video: HTMLVideoElement,
    onCode: (code: string) => void,
): Promise<StopScanning> {
    const hints = new Map<DecodeHintType, unknown>([
        [DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS],
        [DecodeHintType.TRY_HARDER, true],
    ]);
    const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: SCAN_INTERVAL_MS,
        delayBetweenScanSuccess: SCAN_INTERVAL_MS,
    });
    const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) onCode(result.getText());
    });
    return () => controls.stop();
}
