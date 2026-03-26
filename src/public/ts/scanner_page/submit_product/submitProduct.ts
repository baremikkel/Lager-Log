import { SubmitProduct } from "./_SubmitProduct";

document.addEventListener('DOMContentLoaded', () => {
    const inputPlatform = document.getElementById('inputPlatform') as HTMLDivElement
    const barcodeForm = document.getElementById('barcodeForm') as HTMLFormElement
    const barcodeInput = document.getElementById('barcodeInput') as HTMLInputElement
    const productListTemplate = document.getElementById('itemListTemplate') as HTMLTemplateElement

    const productData = inputPlatform.getAttribute('data-products');
    const list = productData ? JSON.parse(productData) : [];
    inputPlatform.removeAttribute('data-products');
    if (!barcodeForm || !barcodeInput || !inputPlatform || !productListTemplate) {
        console.warn('Not all elements found')
        return;
    }
    new SubmitProduct(barcodeForm, barcodeInput, productListTemplate, list);
})