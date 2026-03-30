import { CreateProduct } from "./_CreateNewProduct"

document.addEventListener('DOMContentLoaded', () => {
    const modalBarcode = document.getElementById('modalBarcode') as HTMLInputElement
    const modalProductName = document.getElementById('modalProductName') as HTMLInputElement
    const modalUnits = document.getElementById('modalUnits') as HTMLInputElement    
    const addProductForm = document.getElementById('addProductForm') as HTMLFormElement

    if (!modalBarcode || !modalProductName || !modalUnits || !addProductForm) {
        console.log('Not all elements found')
        return;
    }
    new CreateProduct(addProductForm, modalBarcode, modalProductName, modalUnits);
})