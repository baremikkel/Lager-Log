import { addCategory } from "./_AddCategory"

document.addEventListener('DOMContentLoaded', () => {
    const categoryInput = document.getElementById('categoryInput') as HTMLInputElement
    const addCategoryButton = document.getElementById('addButton') as HTMLButtonElement
    if (!categoryInput || !addCategoryButton) {
        console.log('Input or button not found')
        return;
    }
    new addCategory(categoryInput, addCategoryButton);
})
