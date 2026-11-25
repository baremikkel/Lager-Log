import { ItemList } from "../list/_Item"

class CreateProduct {
    private productForm: HTMLFormElement
    private modalBarcode: HTMLInputElement
    private modalProductName: HTMLInputElement
    private modalUnits: HTMLInputElement
    private modalHasBarcode: HTMLInputElement | null

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
        this.modalHasBarcode = document.getElementById('modalHasBarcode') as HTMLInputElement | null

        this.productForm.addEventListener('submit', (e: Event) => {
            this.createProduct(e)
        })
        this.modalHasBarcode?.addEventListener('change', () => this.updateBarcodeField())
        // form.reset() re-checks the box, so show the barcode field again afterwards.
        this.productForm.addEventListener('reset', () => setTimeout(() => this.updateBarcodeField()))
        this.updateBarcodeField()
    }

    private hasBarcode(): boolean {
        return this.modalHasBarcode?.checked ?? true
    }

    /** Products without a barcode get their id as barcode, so the barcode field is hidden. */
    private updateBarcodeField() {
        const hasBarcode = this.hasBarcode()
        document.getElementById('modalBarcodeField')?.classList.toggle('hidden', !hasBarcode)
        document.getElementById('modalNoBarcodeHint')?.classList.toggle('hidden', hasBarcode)
        this.modalBarcode.disabled = !hasBarcode
        this.modalBarcode.required = hasBarcode
    }

    private async createProduct(e: Event) {
        e.preventDefault()
        const newProduct = {
            has_barcode: this.hasBarcode(),
            product_barcode: this.hasBarcode() ? this.modalBarcode.value.trim() : '',
            product_name: this.modalProductName.value,
            units_per_item: parseInt(this.modalUnits.value),
        }
        const createdProduct = await this.saveProductPostRequest(newProduct)
        if (!createdProduct) {
            alert('Produktet kunne ikke gemmes. Findes stregkoden allerede?')
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
            console.error('Saving product failed:', response?.status);
            return null;
        }
        // The server decides the final barcode (the product id when it has none).
        const { id, product_barcode } = await response.json()
        return { ...newProduct, id, product_barcode }
    }
}

export { CreateProduct }
