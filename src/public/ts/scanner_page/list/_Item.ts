class ItemList {
  private product: any;
  private template: HTMLTemplateElement;
  private count: number = 0;
  private element: HTMLElement;
  private countDisplay: HTMLElement;
  private nameDisplay: HTMLElement;
  private barcodeDisplay: HTMLElement;

  constructor(product: any, template: HTMLTemplateElement) {
    this.product = product;
    this.template = template;

    const clone = this.template.content.cloneNode(true) as DocumentFragment;
    this.element = clone.querySelector(".item-container") as HTMLElement;
    this.countDisplay = clone.querySelector(".count") as HTMLElement;
    this.nameDisplay = clone.querySelector(".product-name") as HTMLElement;
    this.barcodeDisplay = clone.querySelector(".product-barcode") as HTMLElement;

    const incBtn = clone.querySelector(".incrementBtn") as HTMLButtonElement;
    const decBtn = clone.querySelector(".decrementBtn") as HTMLButtonElement;
    const allreadyAdded = document.getElementById(this.product.product_barcode);

    if (allreadyAdded) {
      this.element = allreadyAdded;
      this.countDisplay = allreadyAdded.querySelector(".count") as HTMLElement;
      this.count = parseInt(this.countDisplay.innerText);
      this.checkMode();
      this.countDisplay.textContent = this.count.toString();
      return;
    }
    this.checkMode();

    this.handler(clone, incBtn, decBtn);
  }
  private checkMode() {
    const mode = document
      .getElementById("modeButton")
      ?.getAttribute("data-mode");
    this.count = mode === "add" ? this.count + 1 : this.count - 1;
  }

  private handler(
    clone: DocumentFragment,
    incBtn: HTMLButtonElement,
    decBtn: HTMLButtonElement,
  ): void {
    this.nameDisplay.textContent = this.product.product_name;
    this.barcodeDisplay.textContent = this.product.product_barcode;

    incBtn.onclick = () => this.updateCount(1);
    decBtn.onclick = () => this.updateCount(-1);
    const container = document.getElementById("scannedProductsContainer");
    if (!container) {
      console.error("Container for scanned products not found");
      return;
    }

    container.appendChild(clone);
    this.element.setAttribute("id", this.product.product_barcode);

    this.updateUI();
  }

  public updateCount(delta: number): void {
    this.count += delta;
    this.updateUI();
  }
  private updateUI(): void {
    if (this.countDisplay) {
      this.countDisplay.textContent = this.count.toString();
    }
    if (this.element) {
      const isNegative = this.count < 0;
      this.element.classList.toggle("bg-red-100", isNegative);
      this.element.classList.toggle("bg-green-100", !isNegative);
    }
  }
}
export { ItemList };
