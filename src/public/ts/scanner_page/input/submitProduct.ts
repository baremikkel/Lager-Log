import { SubmitProduct } from "./_SubmitProduct";

document.addEventListener('DOMContentLoaded', () => {
    const inputPlatform = document.getElementById('inputPlatform') as HTMLDivElement
    const barcodeForm = document.getElementById('barcodeForm') as HTMLFormElement
    const barcodeInput = document.getElementById('barcodeInput') as HTMLInputElement
    const productListTemplate = document.getElementById('itemListTemplate') as HTMLTemplateElement

    const payloadData = inputPlatform.getAttribute('data-payload');
    const payload_list = payloadData ? JSON.parse(payloadData) : [];
    inputPlatform.removeAttribute('data-payload');

    if (!barcodeForm || !barcodeInput || !inputPlatform || !productListTemplate) {
        console.warn('Not all elements found')
        return;
    }
    new SubmitProduct(barcodeForm, barcodeInput, productListTemplate, payload_list.products);
})