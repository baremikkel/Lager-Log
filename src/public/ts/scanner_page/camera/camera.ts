import { CameraScanner } from "./_CameraScanner";
import { CameraControls } from "./_CameraControls";
import { CameraList } from "./_CameraList";

document.addEventListener("DOMContentLoaded", () => {
    const openButton = document.getElementById("cameraButton") as HTMLButtonElement;
    const modal = document.getElementById("cameraModal") as HTMLDivElement;
    const video = document.getElementById("cameraVideo") as HTMLVideoElement;
    const status = document.getElementById("cameraStatus") as HTMLParagraphElement;
    const closeButton = document.getElementById("cameraCloseButton") as HTMLButtonElement;
    const barcodeForm = document.getElementById("barcodeForm") as HTMLFormElement;
    const barcodeInput = document.getElementById("barcodeInput") as HTMLInputElement;

    if (!openButton || !modal || !video || !status || !closeButton || !barcodeForm || !barcodeInput) {
        console.warn("Camera scanner elements not found");
        return;
    }
    const scanner = new CameraScanner(openButton, modal, video, status, closeButton, barcodeForm, barcodeInput);

    const listContainer = document.getElementById("scannedProductsContainer") as HTMLDivElement;
    const listHeader = document.getElementById("listHeader") as HTMLDivElement;
    const listSlot = document.getElementById("cameraListSlot") as HTMLDivElement;
    const listEmpty = document.getElementById("cameraListEmpty") as HTMLParagraphElement;
    if (listContainer && listHeader && listSlot && listEmpty) {
        new CameraList(modal, listContainer, listHeader, listSlot, listEmpty);
    } else {
        console.warn("Camera list elements not found");
    }

    const cameraModeButton = document.getElementById("cameraModeButton") as HTMLButtonElement;
    const pageModeButton = document.getElementById("modeButton") as HTMLButtonElement;
    const cameraSendButton = document.getElementById("cameraSendButton") as HTMLButtonElement;
    const pageSendButton = document.getElementById("send-list-btn") as HTMLButtonElement;
    const cameraDoneButton = document.getElementById("cameraDoneButton") as HTMLButtonElement;

    if (!cameraModeButton || !pageModeButton || !cameraSendButton || !pageSendButton || !cameraDoneButton) {
        console.warn("Camera control buttons not found");
        return;
    }
    new CameraControls(
        cameraModeButton, pageModeButton,
        cameraSendButton, pageSendButton,
        cameraDoneButton, () => scanner.close(),
        (text) => scanner.setStatus(text),
    );
});
