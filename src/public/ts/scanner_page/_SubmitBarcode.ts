class SubmitBarcode {
    private barcodeForm: HTMLFormElement
    private barcodeInput: HTMLInputElement
    constructor(barcodeForm: HTMLFormElement, barcodeInput: HTMLInputElement) {
        this.barcodeForm = barcodeForm
        this.barcodeInput = barcodeInput

        this.barcodeForm.addEventListener('submit', (e: Event) => {
           this.submitBarcode(e)
        })
    }
    private async submitBarcode(e: Event) {
        e.preventDefault()
        const barcodeValue = this.barcodeInput.value
        await this.sendGetProductRequest(barcodeValue)
    }

    private async sendGetProductRequest(barcode: string) {
        try {
            const response = await fetch('/api' + window.location.pathname + '?barcode=' + encodeURIComponent(barcode), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        } catch (error) {
            console.error('Error fetching product data:', error)
        }
    }
}
export { SubmitBarcode }