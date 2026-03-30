document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.category-button') as NodeListOf<HTMLButtonElement>;

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected-category');

            button.classList.toggle('bg-blue-600');
            button.classList.toggle('text-white');
            button.classList.toggle('border-blue-600');

            button.classList.toggle('bg-blue-50');
            button.classList.toggle('text-blue-700');
        });
    });
});