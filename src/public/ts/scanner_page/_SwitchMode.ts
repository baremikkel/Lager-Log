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
    const STYLES = {
      remove: {
        btn: "bg-red-400 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-medium text-[20px] whitespace-nowrap remove-mode",
        platform: "bg-red-100 p-6 rounded-2xl shadow-sm w-full md:w-1/2",
      },
      add: {
        btn: "bg-green-400 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium text-[20px] whitespace-nowrap add-mode",
        platform: "bg-green-100 p-6 rounded-2xl shadow-sm w-full md:w-1/2",
      },
    };

    this.isAddMode = !this.isAddMode;

    if (this.isAddMode) {
      this.updateUI("Fjern Mode", STYLES.add.btn, STYLES.add.platform);
    } else {
      this.updateUI("Tilføj Mode", STYLES.remove.btn, STYLES.remove.platform);
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
