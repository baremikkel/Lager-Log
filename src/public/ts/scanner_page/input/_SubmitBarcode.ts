class SubmitBarcode {
    private barcodeForm: HTMLFormElement
    private barcodeInput: HTMLInputElement
    private products: any[]

    constructor(barcodeForm: HTMLFormElement, barcodeInput: HTMLInputElement, products: any[]) {
        this.barcodeForm = barcodeForm
        this.barcodeInput = barcodeInput
        this.products = products

        this.barcodeForm.addEventListener('submit', (e: Event) => {
           this.submitBarcode(e)
        })
    }
    private async submitBarcode(e: Event) {
        e.preventDefault()
        const barcodeValue = this.barcodeInput.value
        for (let i = 0; i < this.products.length; i++) {
            if (this.products[i].product_barcode === barcodeValue) {
                /**
                 * If the product is found add to the list in the next section
                 */
                return
            }
        }
    }

    private async sendGetProductRequest(barcode: string) {
        try {
            const response = await fetch('/api' + window.location.pathname + '?barcode=' + encodeURIComponent(barcode), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!response.ok) {
                console.error('Failed to fetch product data:', response.statusText)
                return
            }
            const data = await response.json()
            if (data.message === "Item not found") {
                return false
            }
        } catch (error) {
            console.error('Error fetching product data:', error)
        }
    }
}
export { SubmitBarcode }