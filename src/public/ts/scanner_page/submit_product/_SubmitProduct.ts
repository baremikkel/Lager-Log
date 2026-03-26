import logger from "../../../../logger"
import { ItemList as ItemList } from "../list/_Item"

class SubmitProduct {
    private barcodeForm: HTMLFormElement
    private barcodeInput: HTMLInputElement
    private productListTemplate: HTMLTemplateElement
    private products: any[]

    constructor(barcodeForm: HTMLFormElement, barcodeInput: HTMLInputElement, productListTemplate: HTMLTemplateElement, products: any[]) {
        this.barcodeForm = barcodeForm
        this.barcodeInput = barcodeInput
        this.productListTemplate = productListTemplate
        this.products = products
        this.barcodeForm.addEventListener('submit', (e: Event) => {
           this.addProduct(e)
        })
    }
    private async addProduct(e: Event) {
        e.preventDefault()
        const barcodeValue = this.barcodeInput.value
        let matched = false

        for (let i = 0; i < this.products.length; i++) {
            if (this.products[i].product_barcode === barcodeValue) {
                new ItemList(this.products[i], this.productListTemplate)
                matched = true
                break
            }
        }

        if (!matched) {
            document.getElementById("addProductModal")?.classList.remove("hidden")
        }
    }

}
export { SubmitProduct }