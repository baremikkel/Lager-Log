import { send } from "process"
import logger from "../../../../logger"
import { ItemList } from "../list/_Item"

class SubmitProduct {
    private barcodeForm: HTMLFormElement
    private barcodeInput: HTMLInputElement
    private productListTemplate: HTMLTemplateElement
    private products: any[]
    private sendListBtn: HTMLButtonElement
    private list: any[] = []

    constructor(barcodeForm: HTMLFormElement, barcodeInput: HTMLInputElement, productListTemplate: HTMLTemplateElement, products: any[], sendListBtn: HTMLButtonElement) {
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
            if(!response) {
                console.error('Failed to send list to server.');
                return; 
            }
            document.querySelectorAll("#scannedProductsContainer .item-container").forEach((element) => {
                element.remove()
            })
            this.list = []
            
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
        }
        this.barcodeInput.value = ""
    }

    private getList() {
        document.querySelectorAll("#scannedProductsContainer .item-container").forEach((item) => {
            const count = parseInt(item.querySelector(".count")?.textContent || "0");
            const stock = parseInt(item.getAttribute("data-stock") || "0");
            const units = parseInt(item.getAttribute("data-units") || "0");
            this.list.push({count, stock, units });
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