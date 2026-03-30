class addCategory {
  private input: HTMLInputElement;
  private button: HTMLButtonElement;
  constructor(input: HTMLInputElement, button: HTMLButtonElement) {
    this.input = input;
    this.button = button;

    this.button.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      this.addCategory();
    });
  }

  private async addCategory() {
    const categoryName = this.input.value.trim();
    if (!categoryName) {
      alert("Please enter a category name");
      return;
    }
    const payload = { name: categoryName };
    await this.sendCategoryPostRequest(payload);
    this.input.value = "";
  }

  private async sendCategoryPostRequest(payload: object) {
    try {
      const response = await fetch("api" + window.location.pathname, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to add category");
      }
      return response.json();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  }
}

export { addCategory };
