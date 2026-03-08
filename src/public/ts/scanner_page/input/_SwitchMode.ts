class SwitchMode {
  private isAddMode: boolean = true;
  private button: HTMLButtonElement;
  private platform: HTMLDivElement;

  constructor(button: HTMLButtonElement, platform: HTMLDivElement) {
    this.button = button;
    this.platform = platform;
    this.button.addEventListener("click", (e: MouseEvent) =>
      this.handleAction(e),
    );
  }

  private handleAction(e: MouseEvent): void {
    e.preventDefault();
    this.isAddMode = !this.isAddMode;

    const STYLES = {
      add: {
        label: "Tilføj Mode",
        btn: "bg-green-400 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium text-[20px] whitespace-nowrap",
        platform: "bg-green-100 p-6 rounded-2xl shadow-sm w-full md:w-1/2",
      },
      remove: {
        label: "Fjern Mode",
        btn: "bg-red-400 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-medium text-[20px] whitespace-nowrap",
        platform: "bg-red-100 p-6 rounded-2xl shadow-sm w-full md:w-1/2",
      },
    };

    if (this.isAddMode) {
      this.updateUI(STYLES.add.label, STYLES.add.btn, STYLES.add.platform);
      this.button.setAttribute("data-mode", 'add');
    } else {
      this.updateUI(STYLES.remove.label, STYLES.remove.btn, STYLES.remove.platform);
      this.button.setAttribute("data-mode", 'remove');
    }
  }

  private updateUI(
    text: string,
    btnClass: string,
    platformClass: string,
  ): void {
    this.button.textContent = text;
    this.button.className = btnClass;
    this.platform.className = platformClass;
  }
}
export { SwitchMode };
