import { UpdateCategory } from "./_UpdateCategory";

document.addEventListener('DOMContentLoaded', () => {
    const updateButton = document.getElementById("updateCategoriesBtn") as HTMLButtonElement;
    const categories = document.querySelectorAll('.category-button') as NodeListOf<HTMLButtonElement>;
    const products = document.querySelectorAll('.uncategorized-product') as NodeListOf<HTMLButtonElement>;
    if (!updateButton || !categories || !products) {
        console.error('One or more required elements not found');
        return;
    }

    new UpdateCategory(updateButton, categories, products);

});