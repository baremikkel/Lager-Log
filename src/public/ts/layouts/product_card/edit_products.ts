function openEditModal(productId: string) {
    const modal = document.getElementById('editProductModal') as HTMLElement;
    const card = document.getElementById(`product_card_${productId}`) as HTMLElement;
    
    if (!modal || !card) return;

    const productName = card.querySelector('#product_name')?.textContent?.trim() || '';
    const barcode = card.querySelector('#product_barcode')?.textContent?.trim() || '';
    const stock = card.getAttribute('#data-stock') || '1';

    (document.getElementById('editProductId') as HTMLInputElement).value = productId;
    (document.getElementById('editProductName') as HTMLInputElement).value = productName;
    (document.getElementById('editProductBarcode') as HTMLInputElement).value = barcode;
    (document.getElementById('editProductStock') as HTMLInputElement).value = stock;

    modal.classList.remove('hidden');
}

function closeEditModal() {
    const modal = document.getElementById('editProductModal') as HTMLElement;
    if (modal) {
        modal.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editProductForm') as HTMLFormElement;
    if (editForm) {
        editForm.addEventListener('submit', async (event: Event) => {
            event.preventDefault();
            
            const formData = new FormData(editForm);
            const data = {
                id: parseInt(formData.get('id') as string),
                product_barcode: formData.get('product_barcode') as string,
                product_name: formData.get('product_name') as string,
                stock: parseInt(formData.get('stock') as string)
            };

            try {
                const response = await fetch('/api/products/edit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    // Update the card display
                    updateProductCard(data);
                    closeEditModal();
                    alert('Produkt opdateret!');
                } else {
                    alert('Fejl ved opdatering af produkt');
                }
            } catch (error) {
                console.error('Error updating product:', error);
                alert('Fejl ved opdatering af produkt');
            }
        });
    }
});

function updateProductCard(data: { id: number; product_barcode: string; product_name: string; stock: number }) {
    const card = document.getElementById(`product_card_${data.id}`) as HTMLElement;
    if (!card) return;

    card.setAttribute('data-stock', data.stock.toString());
    
    const nameEl = card.querySelector('h3');
    if (nameEl) nameEl.textContent = data.product_name;
    
    const barcodeEl = card.querySelector('.text-slate-600.font-mono');
    if (barcodeEl) barcodeEl.textContent = data.product_barcode;
    
    const stockEl = card.querySelector('.text-slate-600.truncate.leading-tight');
    if (stockEl && stockEl.textContent) {
        const parts = stockEl.textContent.split(' ');
        if (parts.length >= 1) {
            parts[0] = data.stock.toString();
            stockEl.textContent = parts.join(' ');
        }
    }

    const amountEl = card.querySelector('.product-amount') as HTMLElement;
    if (amountEl) {
        const currentAmount = parseInt(amountEl.textContent?.trim() || '0');
        const totalEl = card.querySelector('.total-display') as HTMLElement;
        if (totalEl) {
            totalEl.textContent = `(${data.stock * currentAmount} stk på lager)`;
        }
    }
}

export { openEditModal };