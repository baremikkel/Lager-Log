import { BrowserMultiFormatReader, HTMLCanvasElementLuminanceSource } from "@zxing/browser";
import { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer } from "@zxing/library";

// Only the formats used on products. ITF and Code 39 are left out on purpose: they
// often "find" a short code inside part of an EAN barcode, which gave wrong numbers.
const ZXING_FORMATS = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
];
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];

const SCAN_INTERVAL_MS = 60;
// A code only counts once it has been read this many times within CONFIRM_WINDOW_MS, so a
// single blurry frame that decodes to the wrong number is never used. The reads don't have to
// be back to back: on cans and bottles the code is often only readable in some frames.
const CONFIRMATIONS_NEEDED = 2;
const CONFIRM_WINDOW_MS = 1200;
// The aim box is grown by this much on each side so a slightly misaligned code still fits.
const AIM_MARGIN = 0.25;
// Frames larger than this are scaled down before decoding to keep it fast.
const MAX_DECODE_SIZE = 1280;

// Minimal typing for the browser's built-in BarcodeDetector (Chrome on Android).
interface NativeBarcodeDetector {
    detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]>;
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

/** A rectangle in video pixels. */
interface Area { x: number; y: number; w: number; h: number }

/**
 * Which part of the frame to look at. The scanner alternates, one per frame:
 *  - "aim": the area around the red aim box (most barcodes).
 *  - "upright": the middle of the picture turned 90°, for barcodes printed standing up
 *    (common on bottles and jars so the code can be read around the curve).
 */
type Pass = "aim" | "upright";
const PASSES: Pass[] = ["aim", "aim", "upright"];

// ZXing reads 1D barcodes one pixel row at a time with a single black/white threshold per row.
// On cans, jars and bottles one threshold doesn't fit the whole row: the sides are darker, glare
// washes out part of the code, and the bars squeezed together near the edges turn grey. So for
// ZXing each frame is turned into a short image with three bands of rows: the strip as filmed,
// and two copies where every pixel is rescaled between the darkest and lightest pixel near it
// (a small and a larger neighbourhood, since bar width depends on how far away the code is).
// Squashing the height also makes decoding several times faster: bars are vertical, so the
// height carries no information.
const BAND_ROWS = 24;
// Neighbourhood sizes as a fraction of the strip width (a barcode filling half the aim box
// has bars of roughly 1/200 of the width).
const EVEN_OUT_WINDOWS = [1 / 140, 1 / 70];
// Below this light/dark difference an area counts as plain background and becomes white.
const MIN_CONTRAST = 24;

/**
 * Continuously decodes barcodes from the stream shown in `video`.
 * Uses the built-in BarcodeDetector when available (faster and more reliable on Android),
 * otherwise ZXing. `onCode` is only called for codes that pass the checksum and were read
 * more than once.
 */
export async function startDecoding(
    stream: MediaStream,
    video: HTMLVideoElement,
    aimBox: HTMLElement | null,
    onCode: (code: string) => void,
): Promise<StopScanning> {
    video.srcObject = stream;
    await video.play();

    const decoder = await createDecoder();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is not supported");

    const confirm = createConfirmer(onCode);
    let stopped = false;
    let frame = 0;
    let timeoutId: number | undefined;

    const loop = async () => {
        if (stopped) return;
        try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
                const pass = PASSES[frame++ % PASSES.length];
                if (pass === "upright") drawArea(video, centerArea(video), canvas, context, true);
                else drawArea(video, aimArea(video, aimBox), canvas, context, false);

                const result = await decoder.decode(canvas);
                if (result && !stopped && isValid(result.text, result.format)) confirm(result.text);
            }
        } catch (error) {
            console.warn("Barcode decoding failed:", error);
        }
        if (!stopped) timeoutId = window.setTimeout(loop, SCAN_INTERVAL_MS);
    };
    loop();

    return () => {
        stopped = true;
        window.clearTimeout(timeoutId);
    };
}

interface Decoder {
    decode(canvas: HTMLCanvasElement): Promise<{ text: string; format: string } | null>;
}

async function createDecoder(): Promise<Decoder> {
    const zxing = createZxingDecoder();
    const native = await createNativeDetector();
    if (!native) return zxing;

    // Android: the built-in detector is fast and handles rotation, but it gets the picture as
    // filmed. When it finds nothing, every other frame is also tried with ZXing on the
    // evened-out image, which helps with glare and shadows on cans and jars.
    let tryZxing = false;
    return {
        decode: async (canvas) => {
            const [barcode] = await native.detect(canvas);
            if (barcode) return { text: barcode.rawValue, format: barcode.format };
            tryZxing = !tryZxing;
            return tryZxing ? zxing.decode(canvas) : null;
        },
    };
}

function createZxingDecoder(): Decoder {
    const hints = new Map<DecodeHintType, unknown>([
        [DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS],
        [DecodeHintType.TRY_HARDER, true],
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    const bands = document.createElement("canvas");
    const bandsContext = bands.getContext("2d", { willReadFrequently: true });
    if (!bandsContext) throw new Error("Canvas is not supported");
    return {
        decode: async (canvas) => {
            drawBands(canvas, bands, bandsContext);
            try {
                const bitmap = new BinaryBitmap(new HybridBinarizer(new HTMLCanvasElementLuminanceSource(bands)));
                const result = reader.decodeBitmap(bitmap);
                return { text: result.getText(), format: BarcodeFormat[result.getBarcodeFormat()].toLowerCase() };
            } catch {
                return null; // ZXing throws when there is no barcode in the frame.
            }
        },
    };
}

/** Builds the three-band image described at BAND_ROWS: as filmed, then evened out twice. */
function drawBands(source: HTMLCanvasElement, bands: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    const width = source.width;
    const height = BAND_ROWS * (1 + EVEN_OUT_WINDOWS.length);
    if (bands.width !== width) bands.width = width;
    if (bands.height !== height) bands.height = height;

    // "low" smoothing averages rows without also blurring the bars sideways (which "high" does).
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "low";
    for (let band = 0; band <= EVEN_OUT_WINDOWS.length; band++) {
        context.drawImage(source, 0, 0, source.width, source.height, 0, band * BAND_ROWS, width, BAND_ROWS);
    }
    EVEN_OUT_WINDOWS.forEach((fraction, i) => {
        const window = Math.max(3, Math.round(width * fraction));
        evenOutRows(context, width, (i + 1) * BAND_ROWS, BAND_ROWS, window);
    });
}

/**
 * Rescales each pixel between the darkest and lightest pixel within `window` pixels on the
 * same row, so shadows, glare and greyed-out thin bars all become clear black and white.
 */
function evenOutRows(context: CanvasRenderingContext2D, width: number, top: number, rows: number, window: number): void {
    const image = context.getImageData(0, top, width, rows);
    const data = image.data;
    const luminance = new Float32Array(width);
    for (let row = 0; row < rows; row++) {
        const offset = row * width * 4;
        for (let x = 0; x < width; x++) {
            const i = offset + x * 4;
            luminance[x] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }
        for (let x = 0; x < width; x++) {
            let darkest = 255;
            let lightest = 0;
            const end = Math.min(width - 1, x + window);
            for (let k = Math.max(0, x - window); k <= end; k++) {
                const value = luminance[k];
                if (value < darkest) darkest = value;
                if (value > lightest) lightest = value;
            }
            const contrast = lightest - darkest;
            const value = contrast < MIN_CONTRAST ? 255 : ((luminance[x] - darkest) / contrast) * 255;
            const i = offset + x * 4;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
    }
    context.putImageData(image, 0, top);
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

/** The part of the video that is visible on screen (the video uses object-fit: cover). */
function visibleArea(video: HTMLVideoElement): Area & { scale: number; rect: DOMRect } {
    const { videoWidth: vw, videoHeight: vh } = video;
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0, w: vw, h: vh, scale: 1, rect };
    const scale = Math.max(rect.width / vw, rect.height / vh);
    const w = rect.width / scale;
    const h = rect.height / scale;
    return { x: (vw - w) / 2, y: (vh - h) / 2, w, h, scale, rect };
}

/** The video area behind the aim box, plus a margin. Falls back to the visible picture. */
function aimArea(video: HTMLVideoElement, aimBox: HTMLElement | null): Area {
    const visible = visibleArea(video);
    const box = aimBox?.getBoundingClientRect();
    if (!box || box.width === 0) return visible;

    const toVideoX = (screenX: number) => visible.x + (screenX - visible.rect.left) / visible.scale;
    const toVideoY = (screenY: number) => visible.y + (screenY - visible.rect.top) / visible.scale;
    const marginX = box.width * AIM_MARGIN;
    const marginY = box.height * AIM_MARGIN;
    return clamp(video, {
        x: toVideoX(box.left - marginX),
        y: toVideoY(box.top - marginY),
        w: (box.width + 2 * marginX) / visible.scale,
        h: (box.height + 2 * marginY) / visible.scale,
    });
}

/** A square in the middle of the visible picture, for barcodes that stand upright. */
function centerArea(video: HTMLVideoElement): Area {
    const visible = visibleArea(video);
    const side = Math.min(visible.w, visible.h) * 0.9;
    return clamp(video, {
        x: visible.x + (visible.w - side) / 2,
        y: visible.y + (visible.h - side) / 2,
        w: side,
        h: side,
    });
}

function clamp(video: HTMLVideoElement, area: Area): Area {
    const x = Math.max(0, Math.floor(area.x));
    const y = Math.max(0, Math.floor(area.y));
    const w = Math.min(video.videoWidth, Math.ceil(area.x + area.w)) - x;
    const h = Math.min(video.videoHeight, Math.ceil(area.y + area.h)) - y;
    if (w < 50 || h < 20) return { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight };
    return { x, y, w, h };
}

/** Copies `area` of the video onto `canvas`, scaled down if large and optionally turned 90°. */
function drawArea(
    video: HTMLVideoElement,
    area: Area,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    rotate: boolean,
): void {
    const downscale = Math.min(1, MAX_DECODE_SIZE / Math.max(area.w, area.h));
    const w = Math.round(area.w * downscale);
    const h = Math.round(area.h * downscale);
    const canvasW = rotate ? h : w;
    const canvasH = rotate ? w : h;
    if (canvas.width !== canvasW) canvas.width = canvasW;
    if (canvas.height !== canvasH) canvas.height = canvasH;

    context.setTransform(1, 0, 0, 1, 0, 0);
    if (rotate) {
        // Turn clockwise so bars that run sideways in the picture become upright.
        context.translate(canvasW, 0);
        context.rotate(Math.PI / 2);
    }
    context.drawImage(video, area.x, area.y, area.w, area.h, 0, 0, w, h);
}

/** Calls `onCode` once the same code has been read CONFIRMATIONS_NEEDED times within the window. */
function createConfirmer(onCode: (code: string) => void): (code: string) => void {
    const seen = new Map<string, number[]>(); // code -> times it was read
    const reported = new Map<string, number>(); // code -> last time it was reported
    return (code: string) => {
        const now = Date.now();
        const times = (seen.get(code) ?? []).filter((t) => now - t <= CONFIRM_WINDOW_MS);
        times.push(now);
        seen.set(code, times);
        for (const [other, otherTimes] of seen) {
            if (otherTimes.every((t) => now - t > CONFIRM_WINDOW_MS)) seen.delete(other);
        }

        // Report once per sighting: while the code keeps being read, it isn't reported again.
        const lastReported = reported.get(code) ?? 0;
        const stillInView = now - lastReported <= CONFIRM_WINDOW_MS;
        if (times.length >= CONFIRMATIONS_NEEDED && !stillInView) onCode(code);
        if (times.length >= CONFIRMATIONS_NEEDED || stillInView) reported.set(code, now);
    };
}

/** Rejects reads that can't be real: wrong length or a check digit that doesn't add up. */
function isValid(code: string, format: string): boolean {
    switch (format) {
        case "ean_13":
            return /^\d{13}$/.test(code) && hasValidCheckDigit(code);
        case "ean_8":
            return /^\d{8}$/.test(code) && hasValidCheckDigit(code);
        case "upc_a":
            return /^\d{12}$/.test(code) && hasValidCheckDigit(code);
        case "upc_e":
            return /^\d{6,8}$/.test(code);
        default:
            return code.trim().length > 0;
    }
}

/** GTIN check digit (EAN-8, UPC-A, EAN-13): weights 3,1,3,1... from the right, excluding the check digit. */
function hasValidCheckDigit(code: string): boolean {
    const digits = code.split("").map(Number);
    const check = digits.pop()!;
    const sum = digits.reverse().reduce((total, digit, i) => total + digit * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === check;
}

// Exposed for tests.
export { isValid, hasValidCheckDigit };
