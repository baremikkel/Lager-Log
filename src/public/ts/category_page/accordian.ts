function toggleDropdown(id: string) {
        const menu = document.getElementById('dropdownMenu-' + id);
        const arrow = document.getElementById('arrow-' + id);

        if (!menu || !arrow) {
            console.error('Menu or arrow element not found for id:', id);
            return;
        }
        menu.classList.toggle('opacity-0');
        menu.classList.toggle('scale-95');
        menu.classList.toggle('pointer-events-none');

        arrow.classList.toggle('rotate-180');
    }

document.addEventListener('DOMContentLoaded', () => {
    const productButtons = document.querySelectorAll('.uncategorized-product') as NodeListOf<HTMLButtonElement>;

    productButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected-product');

            button.classList.toggle('bg-blue-600');
            button.classList.toggle('text-white');
            button.classList.toggle('border-blue-600');

            button.classList.toggle('bg-blue-50');
            button.classList.toggle('text-blue-700');
        });
    });});

(window as any).toggleDropdown = toggleDropdown;