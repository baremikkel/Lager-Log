import { ItemList } from "../list/_Item"

class CreateProduct {
    private productForm: HTMLFormElement
    private modalBarcode: HTMLInputElement
    private modalProductName: HTMLInputElement
    private modalUnits: HTMLInputElement

    constructor(
        productForm: HTMLFormElement,
        modalBarcode: HTMLInputElement,
        modalProductName: HTMLInputElement,
        modalUnits: HTMLInputElement,
    ) {
        this.productForm = productForm
        this.modalBarcode = modalBarcode
        this.modalProductName = modalProductName
        this.modalUnits = modalUnits
        this.productForm.addEventListener('submit', (e: Event) => {
            this.createProduct(e)
        })
    }

    private async createProduct(e: Event) {
        e.preventDefault()
        const newProduct = {
            product_barcode: this.modalBarcode.value,
            product_name: this.modalProductName.value,
            units_per_item: parseInt(this.modalUnits.value),
        }
        const createdProduct = await this.saveProductPostRequest(newProduct)
        if (!createdProduct) {
            return;
        }
        this.productForm.reset()
        new ItemList(createdProduct, document.getElementById('itemListTemplate') as HTMLTemplateElement)
        document.getElementById("addProductModal")?.classList.add("hidden")
        document.dispatchEvent(new CustomEvent('productCreated', { detail: createdProduct }))
    }

    private async saveProductPostRequest(newProduct: any) {
        let response;
        try {
            response = await fetch('api' + window.location.pathname, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            })
        } catch (error) {
            console.error('Error saving product:', error);
            return null;
        }
        if (!response?.ok) {
            console.error('No response received from server.');
            return null;
        }
        const { id } = await response.json()
        return { ...newProduct, id }
    }
}

export { CreateProduct }