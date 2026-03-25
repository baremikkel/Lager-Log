import { ItemList } from "../list/_Item"

class CreateProduct {
    private productForm: HTMLFormElement
    private modalBarcode: HTMLInputElement
    private modalProductName: HTMLInputElement
    private modalUnits: HTMLInputElement
    private modalUnitselect: HTMLInputElement
    private inputBarcode: HTMLInputElement

    constructor(
        productForm: HTMLFormElement,
        modalBarcode: HTMLInputElement,
        modalProductName: HTMLInputElement,
        modalUnits: HTMLInputElement,
        modalUnitselect: HTMLInputElement
    ) {
        this.productForm = productForm
        this.modalBarcode = modalBarcode
        this.modalProductName = modalProductName
        this.modalUnits = modalUnits
        this.modalUnitselect = modalUnitselect
        this.inputBarcode = document.getElementById('barcodeInput') as HTMLInputElement
        this.modalBarcode.value = this.inputBarcode.value

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
            unit_type: this.modalUnitselect.value
        }
        const success = await this.saveProductPostRequest(newProduct)
        if(!success) {
            return;
        }

        this.productForm.reset()
        new ItemList(newProduct, document.getElementById('itemListTemplate') as HTMLTemplateElement)
        document.getElementById("addProductModal")?.classList.add("hidden")
    }

    private async saveProductPostRequest(newProduct: any) {
        let response;
        try {
            response = await fetch('api' + window.location.pathname, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            })
        } catch (error) {
            console.error('Error saving product:', error);
        }
        if (!response) {
            console.error('No response received from server.');
            return null;
        }
        return true;
    }
}

export { CreateProduct }