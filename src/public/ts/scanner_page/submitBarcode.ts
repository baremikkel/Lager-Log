import { SubmitBarcode } from "./_SubmitBarcode";

document.addEventListener('DOMContentLoaded', () => {
    const barcodeForm = document.getElementById('barcodeForm') as HTMLFormElement
    const barcodeInput = document.getElementById('barcodeInput') as HTMLInputElement
    if (!barcodeForm || !barcodeInput) {
        console.log('Form or input not found')
        return;
    }
    new SubmitBarcode(barcodeForm, barcodeInput)
})