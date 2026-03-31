import { ItemList } from "../list/_Item"

class SubmitProduct {
    private barcodeForm: HTMLFormElement
    private barcodeInput: HTMLInputElement
    private productListTemplate: HTMLTemplateElement
    private products: any[]
    private sendListBtn: HTMLButtonElement
    private list: any[] = []

    constructor(
        barcodeForm: HTMLFormElement,
        barcodeInput: HTMLInputElement,
        productListTemplate: HTMLTemplateElement,
        products: any[],
        sendListBtn: HTMLButtonElement
    ) {
        this.barcodeForm = barcodeForm
        this.barcodeInput = barcodeInput
        this.productListTemplate = productListTemplate
        this.products = products
        this.sendListBtn = sendListBtn

        this.barcodeForm.addEventListener('submit', (e: Event) => {
            this.addProductToList(e)
        })

        this.sendListBtn.addEventListener('click', () => {
            this.getList()
            const response = this.sendItemsPostRequest(this.list)
            if (!response) {
                console.error('Failed to send list to server.');
                return;
            }
            document.querySelectorAll("#scannedProductsContainer .item-container").forEach((element) => {
                element.remove()
            })
            this.list = []
        })

        document.addEventListener('productCreated', (e: Event) => {
            const product = (e as CustomEvent).detail
            this.products.push(product)
        })
    }

    private async addProductToList(e: Event) {
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
            const modalBarcode = document.getElementById('modalBarcode') as HTMLInputElement
            const modalProductName = document.getElementById('modalProductName') as HTMLInputElement
            if (modalBarcode) {
                modalBarcode.value = this.barcodeInput.value
                modalProductName.focus()
            }
        }
        this.barcodeInput.value = ""
    }

    private getList() {
        document.querySelectorAll("#scannedProductsContainer .item-container").forEach((item) => {
            const barcode = item.querySelector(".product-barcode")?.textContent;
            const count = parseInt(item.querySelector(".count")?.textContent || "0");
            const units = parseInt(item.getAttribute("data-units") || "0");
            this.list.push({ barcode, count, units });
        });
    }

    private async sendItemsPostRequest(list: any[]) {
        let response;
        try {
            response = await fetch('api' + window.location.pathname + "/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(list),
            });
        } catch (error) {
            console.error("Error sending items:", error);
        }
        if (!response) {
            console.error('No response received from server.');
            return null;
        }
        return true;
    }
}

export { SubmitProduct }