
class UpdateCategory {
    private updateButton: HTMLButtonElement;
    private categories: NodeListOf<HTMLButtonElement>;
    private products: NodeListOf<HTMLButtonElement>;

    constructor(updateButton: HTMLButtonElement, categories: NodeListOf<HTMLButtonElement>, products: NodeListOf<HTMLButtonElement>) {
        this.updateButton = updateButton;
        this.categories = categories;
        this.products = products;

        this.updateButton.addEventListener('click', (e: MouseEvent) => {
            this.handleSubmit(e);
        });
    }

    private async handleSubmit(e: MouseEvent) {
        e.preventDefault();
        const selectedProducts = Array.from(this.products).filter(btn => btn.classList.contains('selected-product'));
        const selectedCategories = Array.from(this.categories).filter(btn => btn.classList.contains('selected-category'));
        
        const payload = {
            selectedProducts: selectedProducts.map(btn => btn.textContent?.trim() || ''),
            selectedCategories: selectedCategories.map(btn => btn.textContent?.trim() || '')
        };
        
        await this.sendUpdateCategoryPostRequest(payload);
        
    }

    private async sendUpdateCategoryPostRequest(payload: { selectedProducts: string[]; selectedCategories: string[] }) {
        try {
      const response = await fetch("api" + window.location.pathname + "/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
            throw new Error("Failed to update category");
      }
      return response.json();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  }


}

export { UpdateCategory };