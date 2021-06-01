import { WaveManager } from './wave/wave-manager';

let waveManager: WaveManager;

export function activate(): void {
  waveManager = new WaveManager();
  registerEvents();
}

function registerEvents(): void {
  waveManager.registerChangeConfiguration();
  waveManager.registerChangeTextEditorSelection();
}

export function deactivate(): void {
  waveManager.dispose();
}
