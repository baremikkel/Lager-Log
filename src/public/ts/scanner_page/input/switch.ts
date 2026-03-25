import { SwitchMode } from "./_SwitchMode";

document.addEventListener('DOMContentLoaded', () => {
    const modeButton = document.getElementById('modeButton') as HTMLButtonElement
    const platform = document.getElementById('inputPlatform') as HTMLDivElement
    if (!modeButton || !platform) {
        console.warn('Button not found')
        return;
    }
    new SwitchMode(modeButton, platform);
})