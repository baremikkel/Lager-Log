// Settings page: choose which categories get a link in the navigation bar, and their order.

document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('navCategoryList') as HTMLUListElement | null;
    const saveButton = document.getElementById('saveNavSettings') as HTMLButtonElement | null;
    const status = document.getElementById('navSettingsStatus') as HTMLElement | null;
    if (!list || !saveButton || !status) return;

    const rows = () => Array.from(list.querySelectorAll<HTMLLIElement>('.nav-category'));

    const setStatus = (text: string, kind: 'ok' | 'error' | 'info') => {
        status.textContent = text;
        status.classList.toggle('text-green-700', kind === 'ok');
        status.classList.toggle('text-red-700', kind === 'error');
        status.classList.toggle('text-slate-500', kind === 'info');
    };

    const markUnsaved = () => setStatus('Ikke gemt endnu', 'info');

    // The first row can't move up and the last can't move down.
    const updateArrows = () => {
        const all = rows();
        all.forEach((row, index) => {
            (row.querySelector('.nav-category-up') as HTMLButtonElement).disabled = index === 0;
            (row.querySelector('.nav-category-down') as HTMLButtonElement).disabled = index === all.length - 1;
        });
    };

    list.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest('button');
        const row = button?.closest('.nav-category') as HTMLLIElement | null;
        if (!button || !row) return;

        if (button.classList.contains('nav-category-up') && row.previousElementSibling) {
            list.insertBefore(row, row.previousElementSibling);
        } else if (button.classList.contains('nav-category-down') && row.nextElementSibling) {
            list.insertBefore(row.nextElementSibling, row);
        } else {
            return;
        }
        updateArrows();
        button.focus();
        markUnsaved();
    });

    list.addEventListener('change', markUnsaved);

    saveButton.addEventListener('click', async () => {
        const categories = rows().map((row) => ({
            id: parseInt(row.dataset.id || '0'),
            show_in_nav: (row.querySelector('.nav-category-show') as HTMLInputElement).checked,
        }));

        saveButton.disabled = true;
        try {
            const response = await fetch('/api/settings/nav', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // Reload so the navigation bar at the top shows the new choice right away.
            sessionStorage.setItem('navSettingsSaved', '1');
            window.location.reload();
        } catch (error) {
            console.error('Error saving navigation settings:', error);
            setStatus('Indstillingerne kunne ikke gemmes. Prøv igen.', 'error');
            saveButton.disabled = false;
        }
    });

    if (sessionStorage.getItem('navSettingsSaved')) {
        sessionStorage.removeItem('navSettingsSaved');
        setStatus('Gemt. Menuen er opdateret.', 'ok');
    }
    updateArrows();
});
