import Wave from './wave';

let wave: Wave;

export function activate(): void {
  wave = new Wave();
}

export function deactivate(): void {
  wave.reset();
}
