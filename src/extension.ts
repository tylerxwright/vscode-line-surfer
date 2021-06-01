import { WaveManager } from './wave/wave-manager';

let waveManager: WaveManager;

export function activate(): void {
  waveManager = new WaveManager();
}

export function deactivate(): void {
  waveManager.dispose();
}
